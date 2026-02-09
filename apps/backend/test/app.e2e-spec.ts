import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ImaiClient } from './../src/imai/imai.client';

describe('API Endpoints (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    // Create a stub for ImaiClient with minimal deterministic responses
    const mockImaiClient = {
      getInstagramUserInfo: jest.fn().mockResolvedValue({
        status: 'ok',
        user: {
          username: 'instagram',
          full_name: 'Instagram',
          biography: 'Test bio',
          profile_pic_url: 'https://example.com/pic.jpg',
          profile_pic_url_hd: 'https://example.com/pic_hd.jpg',
          media_count: 100,
          follower_count: 1000000,
          following_count: 50,
        },
      }),
      getUserStories: jest.fn((username: string) => {
        // Return different responses based on username for testing
        if (username === 'no_stories_user') {
          // Simulate user with no active stories (reel: null)
          return Promise.resolve({
            status: 'ok',
            reel: null,
          });
        }
        
        // Default: user with active stories
        return Promise.resolve({
          status: 'ok',
          reel: {
            user: {
              username: username,
              profile_pic_url: 'https://example.com/pic.jpg',
            },
            items: [
              {
                id: '123456789',
                pk: '123456789',
                media_type: 2,
                display_url: 'https://example.com/story1.jpg',
                video_url: 'https://example.com/story1.mp4',
                taken_at: 1609459200,
                expiring_at: 1609545600,
              },
              {
                id: '987654321',
                pk: '987654321',
                media_type: 1,
                display_url: 'https://example.com/story2.jpg',
                taken_at: 1609459300,
                expiring_at: 1609545700,
              },
            ],
          },
        });
      }),
      getUserReels: jest.fn((username: string, after?: string) => {
        // Page 1: no cursor provided
        if (!after) {
          return Promise.resolve({
            status: 'ok',
            items: [
              {
                media: {
                  code: 'REELCODE1',
                  pk: 'pk_123',
                  media_type: 2,
                  display_url: 'https://example.com/reel1.jpg',
                  video_url: 'https://example.com/reel1.mp4',
                  like_count: 1000,
                  comment_count: 50,
                },
              },
              {
                media: {
                  code: 'REELCODE2',
                  pk: 'pk_456',
                  media_type: 1,
                  display_url: 'https://example.com/reel2.jpg',
                  like_count: 500,
                  comment_count: 25,
                },
              },
            ],
            end_cursor: 'CURSOR_1',
            more_available: true,
          });
        }
        
        // Page 2: cursor provided
        if (after === 'CURSOR_1') {
          return Promise.resolve({
            status: 'ok',
            items: [
              {
                media: {
                  code: 'REELCODE3',
                  pk: 'pk_789',
                  media_type: 2,
                  display_url: 'https://example.com/reel3.jpg',
                  video_url: 'https://example.com/reel3.mp4',
                  like_count: 300,
                  comment_count: 10,
                },
              },
            ],
            end_cursor: null,
            more_available: false,
          });
        }
        
        // Default empty
        return Promise.resolve({
          status: 'ok',
          items: [],
          end_cursor: null,
          more_available: false,
        });
      }),
      getInstagramHighlights: jest.fn((username: string) => {
        // Scenario A: user with highlights
        if (username === 'highlights_user') {
          return Promise.resolve({
            status: 'ok',
            tray: [
              {
                id: 'highlight:111',
                title: 'Trips',
                media_count: 5,
                cover_media: {
                  cropped_image_version: {
                    url: 'https://example.com/h1.jpg',
                  },
                },
              },
              {
                id: 'highlight:222',
                title: 'Food',
                media_count: 2,
                cover_media: {
                  cropped_image_version: {
                    url: 'https://example.com/h2.jpg',
                  },
                },
              },
            ],
          });
        }
        
        // Scenario B: user with no highlights
        if (username === 'no_highlights_user') {
          return Promise.resolve({
            status: 'ok',
            tray: [],
          });
        }
        
        // Default: empty list
        return Promise.resolve({
          status: 'ok',
          tray: [],
        });
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ImaiClient)
      .useValue(mockImaiClient)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('GET /health should return status ok', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('Profile Endpoint', () => {
    it('GET /profile/:username returns 200 and profile shape', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/instagram')
        .expect(200);

      // Assert on schema, not exact values
      expect(response.body.username).toBe('instagram');
      expect(typeof response.body.fullName).toBe('string');
      expect(typeof response.body.bio).toBe('string');
      expect(typeof response.body.profilePicUrl).toBe('string');
      expect(typeof response.body.posts).toBe('number');
      expect(typeof response.body.followers).toBe('number');
      expect(typeof response.body.following).toBe('number');
      
      // Ensure counts are numbers (can be 0 or positive)
      expect(response.body.posts).toBeGreaterThanOrEqual(0);
      expect(response.body.followers).toBeGreaterThanOrEqual(0);
      expect(response.body.following).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Stories Endpoint', () => {
    it('GET /profile/:username/stories returns empty items when reel is null', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/no_stories_user/stories')
        .expect(200);

      // Assert schema for empty stories
      expect(response.body.status).toBe('ok');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('no_stories_user');
      expect(typeof response.body.user.profilePicUrl).toBe('string');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBe(0);
    });

    it('GET /profile/:username/stories maps items when reel.items exists', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/instagram/stories')
        .expect(200);

      // Assert schema for stories with items
      expect(response.body.status).toBe('ok');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('instagram');
      expect(typeof response.body.user.profilePicUrl).toBe('string');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);

      // Assert first item has required fields
      const firstItem = response.body.items[0];
      expect(firstItem.id).toBeDefined();
      expect(typeof firstItem.id).toBe('string');
      expect(typeof firstItem.mediaType).toBe('number');
      expect(typeof firstItem.imageUrl).toBe('string');
      expect(typeof firstItem.takenAt).toBe('number');
      expect(typeof firstItem.expiringAt).toBe('number');

      // If mediaType is video (2), videoUrl should exist
      if (firstItem.mediaType === 2) {
        expect(firstItem.videoUrl).toBeDefined();
        expect(typeof firstItem.videoUrl).toBe('string');
      }
    });
  });

  describe('Reels Endpoint', () => {
    it('GET /profile/:username/reels returns page 1 with cursor', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/reels_test_user/reels')
        .expect(200);

      // Assert schema for first page
      expect(response.body.status).toBe('ok');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.endCursor).toBe('CURSOR_1');
      expect(response.body.moreAvailable).toBe(true);

      // Assert first item structure
      const firstItem = response.body.items[0];
      expect(typeof firstItem.code).toBe('string');
      expect(typeof firstItem.displayUrl).toBe('string');
      expect(typeof firstItem.mediaType).toBe('number');
      expect(typeof firstItem.likeCount).toBe('number');
      expect(typeof firstItem.commentCount).toBe('number');

      // First item should be video (mediaType 2) with videoUrl
      if (firstItem.mediaType === 2) {
        expect(firstItem.videoUrl).toBeDefined();
        expect(typeof firstItem.videoUrl).toBe('string');
        expect(firstItem.videoUrl.length).toBeGreaterThan(0);
      }
    });

    it('GET /profile/:username/reels returns page 2 when after cursor is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/reels_test_user/reels?after=CURSOR_1')
        .expect(200);

      // Assert schema for second page
      expect(response.body.status).toBe('ok');
      expect(Array.isArray(response.body.items)).toBe(true);
      expect(response.body.items.length).toBeGreaterThan(0);
      expect(response.body.moreAvailable).toBe(false);
      
      // endCursor should be null or empty for last page
      expect(response.body.endCursor === null || response.body.endCursor === '').toBe(true);
    });
  });

  describe('Highlights Endpoint', () => {
    it('GET /profile/:username/highlights returns mapped highlights list', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/highlights_user/highlights')
        .expect(200);

      const body = response.body;

      // Assert response shape
      expect(Array.isArray(body.highlights)).toBe(true);
      expect(body.highlights.length).toBe(2);

      // Assert first highlight schema
      const firstHighlight = body.highlights[0];
      expect(firstHighlight.id).toBe('highlight:111');
      expect(typeof firstHighlight.id).toBe('string');
      expect(firstHighlight.title).toBe('Trips');
      expect(typeof firstHighlight.title).toBe('string');
      expect(firstHighlight.coverUrl).toContain('https://');
      expect(typeof firstHighlight.coverUrl).toBe('string');
      expect(firstHighlight.itemsCount).toBe(5);
      expect(typeof firstHighlight.itemsCount).toBe('number');
    });

    it('GET /profile/:username/highlights returns empty list when no highlights', async () => {
      const response = await request(app.getHttpServer())
        .get('/profile/no_highlights_user/highlights')
        .expect(200);

      const body = response.body;

      // Assert response shape
      expect(Array.isArray(body.highlights)).toBe(true);
      expect(body.highlights.length).toBe(0);
    });
  });
});
