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
import { ImaiClient } from './imai/imai.client';

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
  async search(@Query('query') query: string): Promise<string[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const response = await this.imaiClient.searchInstagramUsers(query);

    // Map upstream response to username array
    const usernames = response.list
      .map((item) => item.user?.username)
      .filter((username): username is string => Boolean(username));

    return usernames;
  }

  @Get('profile/:username')
  async getProfile(@Param('username') username: string): Promise<ProfileDto> {
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
