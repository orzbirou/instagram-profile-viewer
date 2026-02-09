import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

/**
 * Custom error class for IMAI API errors with detailed upstream information
 */
export class ImaiUpstreamError extends Error {
  constructor(
    message: string,
    public readonly upstreamStatus: number,
    public readonly upstreamBody: unknown,
    public readonly upstreamPath: string,
    public readonly upstreamQuery: Record<string, string>,
    public readonly upstreamHeaders: Record<string, string>,
  ) {
    super(message);
    this.name = 'ImaiUpstreamError';
  }
}

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
  users?: Array<{
    pk?: number;
    id?: string;
    username?: string;
    full_name?: string;
    profile_pic_url?: string;
    is_verified?: boolean;
    follower_count?: number;
    is_private?: boolean;
    social_context?: string | null;
    [key: string]: unknown;
  }>;
  list?: Array<{
    user?: {
      username?: string;
      full_name?: string;
      profile_pic_url?: string;
      is_verified?: boolean;
      follower_count?: number;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  }>;
  data?: {
    users?: Array<any>;
    list?: Array<any>;
    [key: string]: unknown;
  };
  has_more?: boolean;
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

interface ImaiHighlightsResponse {
  status: string;
  tray?: Array<{
    id?: string;
    title?: string;
    cover_media?: {
      cropped_image_version?: {
        url?: string;
      };
    };
    media_count?: number;
    [key: string]: unknown;
  }>;
  highlights?: Array<{
    id?: string;
    title?: string;
    cover_image_url?: string;
    media_count?: number;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
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

  // Rate limiting: reasonable interval for autocomplete
  private lastRequestTime = 0;
  private readonly minRequestInterval = 200; // 200ms for responsive autocomplete
  private requestQueue: QueuedRequest<unknown>[] = [];
  private isProcessingQueue = false;

  // In-memory cache with TTL
  private searchCache = new Map<string, CacheEntry<ImaiSearchResponse>>();
  private userInfoCache = new Map<string, CacheEntry<ImaiUserInfoResponse>>();
  private highlightsCache = new Map<string, CacheEntry<ImaiHighlightsResponse>>();
  private readonly searchCacheTTL = 30000; // 30 seconds for better cache reuse
  private readonly userInfoCacheTTL = 60000; // 60 seconds
  private readonly highlightsCacheTTL = 60000; // 60 seconds

  constructor() {
    this.apiKey = process.env.IMAI_API_KEY || '';
    this.baseUrl = process.env.IMAI_BASE_URL || 'https://imai.co/api/';

    if (!this.apiKey) {
      throw new Error('IMAI_API_KEY environment variable is required');
    }
  }

  /**
   * Process the request queue with rate limiting (200ms between requests)
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

    try {
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'authkey': this.apiKey,
        },
      });

      // Extract safe headers (rate limit info, etc.)
      const safeHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        if (key.startsWith('x-') || key.startsWith('ratelimit-') || key === 'retry-after') {
          safeHeaders[key] = value;
        }
      });

      // Handle rate limiting
      if (response.status === 429) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text().catch(() => 'Rate limit exceeded');
        }
        
        throw new ImaiUpstreamError(
          'Rate limit exceeded. Please try again later.',
          response.status,
          errorBody,
          path,
          params,
          safeHeaders,
        );
      }

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text().catch(() => 'Authentication failed');
        }
        
        console.error('[ImaiClient] Authentication failed - check IMAI_API_KEY');
        throw new ImaiUpstreamError(
          'Upstream API authentication failed. Please verify IMAI_API_KEY.',
          response.status,
          errorBody,
          path,
          params,
          safeHeaders,
        );
      }

      // Handle other client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text().catch(() => 'Unknown error');
        }
        
        throw new ImaiUpstreamError(
          `Upstream API error: ${JSON.stringify(errorBody)}`,
          response.status,
          errorBody,
          path,
          params,
          safeHeaders,
        );
      }

      // Handle server errors (5xx) or other non-2xx
      if (!response.ok) {
        let errorBody: unknown;
        try {
          errorBody = await response.json();
        } catch {
          errorBody = await response.text().catch(() => 'Service unavailable');
        }
        
        throw new ImaiUpstreamError(
          'Upstream service unavailable',
          response.status,
          errorBody,
          path,
          params,
          safeHeaders,
        );
      }

      // Get response text first to debug HTML responses
      const responseText = await response.text();
      let data: unknown;
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        throw new HttpException(
          `Upstream API returned invalid JSON (status: ${response.status})`,
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
      // Re-throw ImaiUpstreamError to preserve detailed error info
      if (error instanceof ImaiUpstreamError) {
        throw error;
      }

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

  /**
   * Get Instagram highlights (story highlights) for a user
   * 
   * @param username - Username or user ID
   * @returns Highlights response containing array of highlights
   */
  async getInstagramHighlights(username: string): Promise<ImaiHighlightsResponse> {
    // Check cache first
    const cached = this.getCached(
      this.highlightsCache,
      username,
      this.highlightsCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<ImaiHighlightsResponse>('raw/ig/user/highlights/', {
        url: username,
      }),
    );

    // Cache successful responses only (status === "ok")
    if (result.status === 'ok') {
      this.setCache(this.highlightsCache, username, result);
    }

    return result;
  }

  /**
   * Get hashtag feed (recent or top posts)
   * 
   * @param hashtag - Hashtag without # symbol
   * @param type - Feed type: 'recent' or 'top'
   * @param after - Cursor for pagination
   * @returns Hashtag feed response with items and pagination info
   */
  async getHashtagFeed(
    hashtag: string,
    type: 'recent' | 'top' = 'recent',
    after?: string,
  ): Promise<any> {
    const params: Record<string, string> = {
      hashtag,
      type,
    };

    if (after) {
      params.after = after;
    }

    // Build cache key
    const cacheKey = `${hashtag}:${type}:${after || 'first'}`;

    // Check cache first (30s TTL like search)
    const cached = this.getCached(
      this.searchCache as any, // Reuse search cache map
      cacheKey,
      this.searchCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<any>('raw/ig/hashtag/feed/', params),
    );

    // Cache successful responses
    if (result.status === 'ok') {
      this.setCache(this.searchCache as any, cacheKey, result);
    }

    return result;
  }

  /**
   * Get user feed (posts)
   * 
   * @param username - Instagram username
   * @param after - Cursor for pagination
   * @returns User feed response with items and pagination info
   */
  async getUserFeed(username: string, after?: string): Promise<any> {
    const params: Record<string, string> = {
      url: username,
    };

    if (after) {
      params.after = after;
    }

    // Build cache key
    const cacheKey = `user:${username}:${after || 'first'}`;

    // Check cache first (30s TTL)
    const cached = this.getCached(
      this.searchCache as any,
      cacheKey,
      this.searchCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<any>('raw/ig/user/feed/', params),
    );

    // Cache successful responses
    if (result.status === 'ok') {
      this.setCache(this.searchCache as any, cacheKey, result);
    }

    return result;
  }

  /**
   * Get user reels
   * 
   * @param username - Instagram username
   * @param after - Cursor for pagination
   * @returns User reels response with items and pagination info
   */
  async getUserReels(username: string, after?: string): Promise<any> {
    const params: Record<string, string> = {
      url: username,
    };

    if (after) {
      params.after = after;
    }

    // Build cache key
    const cacheKey = `reels:${username}:${after || 'first'}`;

    // Check cache first (30s TTL)
    const cached = this.getCached(
      this.searchCache as any,
      cacheKey,
      this.searchCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<any>('raw/ig/user/reels/', params),
    );

    // Cache successful responses
    if (result.status === 'ok') {
      this.setCache(this.searchCache as any, cacheKey, result);
    }

    return result;
  }

  /**
   * Get media info by code
   * 
   * @param code - Instagram media code (shortcode)
   * @returns Media info response with detailed post information
   */
  async getMediaInfo(code: string): Promise<any> {
    const params: Record<string, string> = {
      code,
    };

    // Build cache key
    const cacheKey = `media:${code}`;

    // Check cache first (60s TTL like user info)
    const cached = this.getCached(
      this.userInfoCache as any,
      cacheKey,
      this.userInfoCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<any>('raw/ig/media/info/', params),
    );

    // Cache successful responses
    if (result.status === 'ok') {
      this.setCache(this.userInfoCache as any, cacheKey, result);
    }

    return result;
  }

  /**
   * Get media comments
   * 
   * @param code - Instagram media code (shortcode)
   * @param after - Cursor for pagination
   * @returns Comments response with list of comments and pagination info
   */
  async getMediaComments(code: string, after?: string): Promise<any> {
    const params: Record<string, string> = {
      code,
    };

    if (after) {
      params.after = after;
    }

    // Build cache key
    const cacheKey = `comments:${code}:${after || 'first'}`;

    // Check cache first (30s TTL like posts)
    const cached = this.getCached(
      this.searchCache as any,
      cacheKey,
      this.searchCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<any>('raw/ig/media/comments/', params),
    );

    // Cache successful responses
    if (result.status === 'ok') {
      this.setCache(this.searchCache as any, cacheKey, result);
    }

    return result;
  }

  /**
   * Get user stories
   * 
   * @param username - Instagram username
   * @returns User stories response with items
   */
  async getUserStories(username: string): Promise<any> {
    const params: Record<string, string> = {
      url: username,
    };

    // Build cache key
    const cacheKey = `stories:${username}`;

    // Check cache first (30s TTL)
    const cached = this.getCached(
      this.searchCache as any,
      cacheKey,
      this.searchCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<any>('raw/ig/user/stories/', params),
    );

    // Cache successful responses
    if (result.status === 'ok') {
      this.setCache(this.searchCache as any, cacheKey, result);
    }

    return result;
  }

  /**
   * Get highlight items by highlight ID
   * 
   * @param highlightId - Highlight ID (e.g., "highlight:18029499352961095")
   * @returns Highlight items response
   */
  async getHighlightItems(highlightId: string): Promise<any> {
    const params: Record<string, string> = {
      highlight_id: highlightId,
    };

    // Build cache key
    const cacheKey = `highlight:${highlightId}`;

    // Check cache first (60s TTL)
    const cached = this.getCached(
      this.userInfoCache as any,
      cacheKey,
      this.userInfoCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<any>('raw/ig/highlight/info/', params),
    );

    // Cache successful responses
    if (result.status === 'ok') {
      this.setCache(this.userInfoCache as any, cacheKey, result);
    }

    return result;
  }

  /**
   * Get user tagged feed
   * 
   * @param username - Instagram username
   * @param after - Cursor for pagination
   * @returns User tagged feed response with items and pagination info
   */
  async getUserTagsFeed(username: string, after?: string): Promise<any> {
    const params: Record<string, string> = {
      url: username,
    };

    if (after) {
      params.after = after;
    }

    // Build cache key
    const cacheKey = `tagged:${username}:${after || 'first'}`;

    // Check cache first (30s TTL)
    const cached = this.getCached(
      this.searchCache as any,
      cacheKey,
      this.searchCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<any>('raw/ig/usertags/feed/', params),
    );

    // Cache successful responses
    if (result.status === 'ok') {
      this.setCache(this.searchCache as any, cacheKey, result);
    }

    return result;
  }

  /**
   * Get user reposted feed
   * 
   * @param username - Instagram username
   * @param after - Cursor for pagination
   * @returns User reposted feed response with items and pagination info
   */
  async getUserRepostedFeed(username: string, after?: string): Promise<any> {
    const params: Record<string, string> = {
      url: username,
    };

    if (after) {
      params.after = after;
    }

    // Build cache key
    const cacheKey = `reposts:${username}:${after || 'first'}`;

    // Check cache first (30s TTL)
    const cached = this.getCached(
      this.searchCache as any,
      cacheKey,
      this.searchCacheTTL,
    );
    if (cached) {
      return cached;
    }

    // Enqueue request with rate limiting
    const result = await this.enqueueRequest(() =>
      this.request<any>('raw/ig/user/reposted_feed/', params),
    );

    // Cache successful responses
    if (result.status === 'ok') {
      this.setCache(this.searchCache as any, cacheKey, result);
    }

    return result;
  }
}
