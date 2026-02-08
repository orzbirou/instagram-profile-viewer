import {
  Controller,
  Get,
  Query,
  Param,
  HttpException,
  HttpStatus,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response } from 'express';
import type { ProfileDto } from './dto/profile.dto';
import { 
  HashtagFeedResponseDto, 
  HashtagFeedItemDto, 
  HashtagFeedUserDto,
  HashtagFeedCarouselItemDto 
} from './dto/hashtag-feed.dto';
import { UserPostsResponseDto, UserPostItemDto } from './dto/user-posts.dto';
import { ImaiClient } from './imai/imai.client';

/**
 * Main API Controller
 * 
 * Highlights Endpoint Manual Testing:
 * -----------------------------------
 * 1. Test successful fetch:
 *    GET /profile/cristiano/highlights
 *    - Should return { highlights: [...] }
 *    - Each highlight has: id, title, coverUrl?, itemsCount
 *    - Response cached for 60s
 * 
 * 2. Test error handling:
 *    - Invalid username: should return 502 with error message
 *    - Upstream timeout: should return 502
 *    - Check logs for error details (no sensitive data leaked)
 * 
 * 3. Test caching:
 *    - First request logs "Fetching highlights"
 *    - Second request (within 60s) uses cache (faster response)
 * 
 * 4. Test rate limiting:
 *    - Multiple rapid requests should be queued (200ms between)
 *    - No 429 errors under normal load
 */
@Controller()
export class AppController {
  constructor(private readonly imaiClient: ImaiClient) {}

  @Get()
  getHello(): string {
    return 'Instagram Profile Viewer API';
  }

  @Get('health')
  getHealth(): { status: string } {
    return { status: 'ok' };
  }

  @Get('search')
  async search(@Query('query') query: string): Promise<{ users: any[] }> {
    try {
      if (!query || query.trim().length === 0) {
        return { users: [] };
      }

      const response = await this.imaiClient.searchInstagramUsers(query);

      // Support multiple response shapes: users, list, data.users, data.list
      const rawUsers = Array.isArray(response.users)
        ? response.users
        : Array.isArray(response.list)
        ? response.list
        : Array.isArray(response.data?.users)
        ? response.data.users
        : Array.isArray(response.data?.list)
        ? response.data.list
        : [];

      // Map to rich user objects
      // Handle both direct user objects and nested user objects
      const users = rawUsers
        .map((item: any) => {
          // Direct user object (users array)
          if (item.username) {
            return {
              username: item.username,
              fullName: item.full_name || undefined,
              profilePicUrl: item.profile_pic_url || undefined,
              isVerified: item.is_verified || false,
              followersCount: item.follower_count || undefined,
            };
          }
          // Nested user object (list array)
          if (item.user?.username) {
            return {
              username: item.user.username,
              fullName: item.user.full_name || undefined,
              profilePicUrl: item.user.profile_pic_url || undefined,
              isVerified: item.user.is_verified || false,
              followersCount: item.user.follower_count || undefined,
            };
          }
          return null;
        })
        .filter((user): user is any => user !== null);

      return { users };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Failed to search users',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('profile/:username/highlights')
  async getHighlights(
    @Param('username') username: string,
  ): Promise<{ highlights: any[] }> {
    // Mocked highlights data (UI-only implementation)
    // TODO: Replace with real API call when backend supports highlights
    const mockedHighlights = [
      { id: 'h1', title: 'Trips', coverUrl: null, itemsCount: 5 },
      { id: 'h2', title: 'Food', coverUrl: null, itemsCount: 8 },
      { id: 'h3', title: 'Work', coverUrl: null, itemsCount: 3 },
      { id: 'h4', title: 'Fitness', coverUrl: null, itemsCount: 12 },
      { id: 'h5', title: 'Music', coverUrl: null, itemsCount: 6 },
    ];

    return { highlights: mockedHighlights };
  }

  @Get('profile/:username')
  async getProfile(@Param('username') username: string): Promise<ProfileDto> {
    try {
      const response = await this.imaiClient.getInstagramUserInfo(username);

      // Map upstream response to ProfileDto
      const profileDto: ProfileDto = {
        username: response.user.username,
        fullName: response.user.full_name,
        bio: response.user.biography,
        profilePicUrl:
          response.user.profile_pic_url_hd ?? response.user.profile_pic_url,
        posts: response.user.media_count,
        followers: response.user.follower_count,
        following: response.user.following_count,
      };

      return profileDto;
    } catch (error) {
      throw new HttpException(
        {
          message: 'Failed to fetch profile',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('profile/:username/posts')
  async getUserPosts(
    @Param('username') username: string,
    @Query('after') after?: string,
  ): Promise<UserPostsResponseDto> {
    try {
      // Validate username
      if (!username || username.trim().length === 0) {
        throw new BadRequestException('Username is required');
      }

      // Call IMAI API
      const response = await this.imaiClient.getUserFeed(username.trim(), after);

      // Map to slim DTO
      const items: UserPostItemDto[] = (response.items || []).map((item: any) => ({
        code: item.code || item.pk,
        displayUrl: item.display_url || item.image_versions2?.candidates?.[0]?.url || '',
        mediaType: item.media_type,
        likeCount: item.like_count,
        commentCount: item.comment_count,
      }));

      return {
        status: 'ok',
        items,
        endCursor: response.end_cursor,
        moreAvailable: response.more_available || false,
      };
    } catch (error) {
      throw new HttpException(
        {
          message: 'Failed to fetch user posts',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('ig/hashtag-feed')
  async getHashtagFeed(
    @Query('hashtag') hashtag: string,
    @Query('type') type?: string,
    @Query('after') after?: string,
  ): Promise<HashtagFeedResponseDto> {
    try {
      // Validate hashtag
      if (!hashtag || hashtag.trim().length === 0) {
        throw new BadRequestException('Hashtag is required');
      }

      // Validate type (default to 'recent')
      const feedType = type && (type === 'top' || type === 'recent') ? type : 'recent';

      // Call IMAI API
      const response = await this.imaiClient.getHashtagFeed(
        hashtag.trim(),
        feedType,
        after,
      );

      // Map to slim DTO
      const items: HashtagFeedItemDto[] = (response.items || []).map((item: any) => {
        // Extract user info
        const user: HashtagFeedUserDto = {
          username: item.user?.username || 'unknown',
          full_name: item.user?.full_name || '',
          profile_pic_url: item.user?.profile_pic_url || '',
          is_verified: item.user?.is_verified || false,
        };

        // Extract carousel media if present
        let carouselMedia: HashtagFeedCarouselItemDto[] | undefined;
        if (item.carousel_media && Array.isArray(item.carousel_media)) {
          carouselMedia = item.carousel_media.map((carouselItem: any) => ({
            display_url: carouselItem.display_url || carouselItem.image_versions2?.candidates?.[0]?.url || '',
            video_url: carouselItem.video_url,
            image_candidates_url: carouselItem.image_versions2?.candidates?.[0]?.url,
          }));
        }

        // Build item DTO
        const feedItem: HashtagFeedItemDto = {
          pk: String(item.pk || item.id || ''),
          code: item.code || item.pk || '',
          display_url: item.display_url || item.image_versions2?.candidates?.[0]?.url || '',
          image_candidates_url: item.image_versions2?.candidates?.[0]?.url,
          taken_at: item.taken_at || Date.now() / 1000,
          like_count: item.like_count || 0,
          comment_count: item.comment_count || 0,
          view_count: item.view_count,
          play_count: item.play_count,
          video_url: item.video_url,
          carousel_media_count: item.carousel_media_count || carouselMedia?.length || 0,
          carousel_media: carouselMedia,
          user,
        };

        return feedItem;
      });

      return {
        items,
        more_available: response.more_available || false,
        end_cursor: response.end_cursor,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new HttpException(
        {
          message: 'Failed to fetch hashtag feed',
          details: error instanceof Error ? error.message : 'Unknown error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('proxy/image')
  async proxyImage(
    @Query('url') imageUrl: string,
    @Res() res: Response,
  ): Promise<void> {
    // Validate input
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new BadRequestException('URL parameter is required');
    }

    // Validate HTTPS
    if (!imageUrl.startsWith('https://')) {
      throw new BadRequestException('Only HTTPS URLs are allowed');
    }

    // Parse and validate hostname
    let hostname: string;
    try {
      const url = new URL(imageUrl);
      hostname = url.hostname.toLowerCase();
    } catch {
      throw new BadRequestException('Invalid URL format');
    }

    // Allowlist Instagram CDN domains
    const allowedDomains = [
      'instagram.com',
      'cdninstagram.com',
      'fbcdn.net',
      'scontent-lax3-2.cdninstagram.com',
      'scontent.cdninstagram.com',
    ];

    const isAllowed = allowedDomains.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );

    if (!isAllowed) {
      throw new BadRequestException(
        'URL hostname not in allowlist. Only Instagram CDN domains are allowed.',
      );
    }

    try {
      // Fetch the image from upstream
      const response = await fetch(imageUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/*,*/*',
        },
        redirect: 'follow',
      });

      // Check response status
      if (!response.ok) {
        console.error(
          `[ImageProxy] Upstream returned ${response.status} for ${imageUrl}`,
        );
        throw new HttpException(
          `Upstream image server returned ${response.status}`,
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Validate content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        console.error(
          `[ImageProxy] Invalid content-type: ${contentType} for ${imageUrl}`,
        );
        throw new HttpException(
          'Upstream did not return an image',
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Stream the image to the client
      const imageBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(imageBuffer);

      // Set response headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=300'); // 5 minutes
      res.setHeader('Content-Length', buffer.length);

      // Send the image
      res.send(buffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      console.error('[ImageProxy] Failed to fetch image:', error);
      throw new HttpException(
        'Failed to fetch image from upstream',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
