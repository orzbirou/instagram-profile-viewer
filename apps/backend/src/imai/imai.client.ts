import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

/**
 * IMAI API Client
 * 
 * Provides methods to interact with the IMAI Instagram API.
 * 
 * Required environment variables:
 * - IMAI_API_KEY: API key for authentication (required)
 * - IMAI_BASE_URL: Base URL for the API (optional, defaults to https://imai.co)
 */

interface ImaiSearchResponse {
  status: string;
  list: Array<{
    user?: {
      username?: string;
      full_name?: string;
      profile_pic_url?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
}

interface ImaiUserInfoResponse {
  status: string;
  user: {
    username: string;
    full_name: string;
    biography: string;
    profile_pic_url: string;
    profile_pic_url_hd?: string;
    media_count: number;
    follower_count: number;
    following_count: number;
    [key: string]: unknown;
  };
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface QueuedRequest<T> {
  execute: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

@Injectable()
export class ImaiClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  // Rate limiting: max 1 request per second
  private lastRequestTime = 0;
  private readonly minRequestInterval = 1000; // 1 second in ms
  private requestQueue: QueuedRequest<unknown>[] = [];
  private isProcessingQueue = false;

  // In-memory cache with TTL
  private searchCache = new Map<string, CacheEntry<ImaiSearchResponse>>();
  private userInfoCache = new Map<string, CacheEntry<ImaiUserInfoResponse>>();
  private readonly searchCacheTTL = 3000; // 3 seconds
  private readonly userInfoCacheTTL = 10000; // 10 seconds

  constructor() {
    this.apiKey = process.env.IMAI_API_KEY || '';
    this.baseUrl = process.env.IMAI_BASE_URL || 'https://imai.co/api/';

    console.log('[ImaiClient] Initialized with base URL:', this.baseUrl);
    console.log('[ImaiClient] API key present:', !!this.apiKey, this.apiKey ? `(length: ${this.apiKey.length})` : '');

    if (!this.apiKey) {
      throw new Error('IMAI_API_KEY environment variable is required');
    }
  }

  /**
   * Process the request queue with rate limiting (max 1 request per second)
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;

      if (timeSinceLastRequest < this.minRequestInterval) {
        // Wait for the remaining time
        await new Promise((resolve) =>
          setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest),
        );
      }

      const queuedRequest = this.requestQueue.shift();
      if (queuedRequest) {
        this.lastRequestTime = Date.now();
        try {
          const result = await queuedRequest.execute();
          queuedRequest.resolve(result);
        } catch (error) {
          queuedRequest.reject(error);
        }
      }
    }

    this.isProcessingQueue = false;
  }

  /**
   * Add a request to the queue and return a promise
   */
  private async enqueueRequest<T>(
    execute: () => Promise<T>,
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.requestQueue.push({ execute, resolve, reject });
      void this.processQueue();
    });
  }

  /**
   * Get cached value if valid
   */
  private getCached<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    ttl: number,
  ): T | null {
    const entry = cache.get(key);
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
      cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store value in cache
   */
  private setCache<T>(
    cache: Map<string, CacheEntry<T>>,
    key: string,
    data: T,
  ): void {
    cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Makes an authenticated request to the IMAI API
   */
  private async request<T>(
    path: string,
    params: Record<string, string> = {},
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const requestUrl = url.toString();
    const requestUrlWithoutKey = requestUrl; // URL doesn't contain the key
    console.log('[ImaiClient] Making request to:', requestUrlWithoutKey);
    console.log('[ImaiClient] Using API key:', this.apiKey ? `${this.apiKey.substring(0, 4)}...${this.apiKey.substring(this.apiKey.length - 4)}` : 'MISSING');

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'authkey': this.apiKey,
        },
      });

      console.log('[ImaiClient] Response status:', response.status);
      console.log('[ImaiClient] Response headers:', JSON.stringify(Object.fromEntries(response.headers.entries())));

      // Handle rate limiting
      if (response.status === 429) {
        throw new HttpException(
          'Rate limit exceeded. Please try again later.',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.error('[ImaiClient] Authentication failed - check IMAI_API_KEY');
        throw new HttpException(
          'Upstream API authentication failed. Please verify IMAI_API_KEY.',
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Handle other client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        let errorMessage = 'Upstream API error';
        try {
          const errorBody = await response.json();
          errorMessage = JSON.stringify(errorBody);
        } catch {
          const errorText = await response.text().catch(() => 'Unknown error');
          errorMessage = errorText || `HTTP ${response.status}`;
        }
        throw new HttpException(
          `Upstream API error: ${errorMessage}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Handle server errors (5xx) or other non-2xx
      if (!response.ok) {
        throw new HttpException(
          'Upstream service unavailable',
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Get response text first to debug HTML responses
      const responseText = await response.text();
      let data: unknown;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('[ImaiClient] Failed to parse JSON response');
        console.error('[ImaiClient] Response status:', response.status);
        console.error('[ImaiClient] Content-Type:', response.headers.get('content-type'));
        console.error('[ImaiClient] Response text (first 500 chars):', responseText.substring(0, 500));
        throw new HttpException(
          `Upstream API returned invalid JSON (status: ${response.status}, content-type: ${response.headers.get('content-type')})`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Validate response status field
      if (
        typeof data === 'object' &&
        data !== null &&
        'status' in data &&
        data.status !== 'ok'
      ) {
        throw new HttpException(
          'Upstream returned non-ok status',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return data as T;
    } catch (error) {
      // Re-throw HttpExceptions as-is
      if (error instanceof HttpException) {
        throw error;
      }

      // Network errors or other failures
      console.error('[ImaiClient] Request failed:', error);
      throw new HttpException(
        'Failed to connect to upstream service',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  /**
   * Search Instagram users by keyword
   * 
   * @param keyword - Search query string
   * @returns Search response containing matching users
   */
  async searchInstagramUsers(keyword: string): Promise<ImaiSearchResponse> {
    // Check cache first
    const cached = this.getCached(
      this.searchCache,
      keyword,
      this.searchCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<ImaiSearchResponse>('raw/ig/search/users/', {
        keyword,
      }),
    );

    // Cache successful responses only (status === "ok")
    if (result.status === 'ok') {
      this.setCache(this.searchCache, keyword, result);
    }

    return result;
  }

  /**
   * Get Instagram user information
   * 
   * @param url - Username, user ID, or profile URL
   * @returns User profile information
   */
  async getInstagramUserInfo(url: string): Promise<ImaiUserInfoResponse> {
    // Check cache first
    const cached = this.getCached(
      this.userInfoCache,
      url,
      this.userInfoCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<ImaiUserInfoResponse>('raw/ig/user/info/', {
        url,
      }),
    );

    // Cache successful responses only (status === "ok")
    if (result.status === 'ok') {
      this.setCache(this.userInfoCache, url, result);
    }

    return result;
  }
}
