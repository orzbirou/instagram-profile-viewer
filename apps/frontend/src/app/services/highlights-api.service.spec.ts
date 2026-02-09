import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { HighlightsApiService, HighlightsResponse, StoriesResponse } from './highlights-api.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

describe('HighlightsApiService', () => {
  let service: HighlightsApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        HighlightsApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(HighlightsApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getHighlights', () => {
    it('should return highlights list with id and coverUrl', async () => {
      const mockResponse: HighlightsResponse = {
        highlights: [
          {
            id: 'highlight:111',
            title: 'Trips',
            coverUrl: 'https://example.com/h1.jpg',
            itemsCount: 5
          },
          {
            id: 'highlight:222',
            title: 'Food',
            coverUrl: 'https://example.com/h2.jpg',
            itemsCount: 3
          }
        ]
      };

      const highlightsPromise = firstValueFrom(service.getHighlights('testuser'));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/profile/testuser/highlights`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const response = await highlightsPromise;
      expect(Array.isArray(response.highlights)).toBe(true);
      expect(response.highlights.length).toBe(2);
      expect(response.highlights[0].id).toBe('highlight:111');
      expect(response.highlights[0].coverUrl).toBe('https://example.com/h1.jpg');
    });

    it('should return empty highlights array when user has no highlights', async () => {
      const mockResponse: HighlightsResponse = {
        highlights: []
      };

      const highlightsPromise = firstValueFrom(service.getHighlights('no_highlights_user'));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/profile/no_highlights_user/highlights`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const response = await highlightsPromise;
      expect(Array.isArray(response.highlights)).toBe(true);
      expect(response.highlights.length).toBe(0);
    });
  });

  describe('getStories', () => {
    it('should return stories with items array', async () => {
      const mockResponse: StoriesResponse = {
        status: 'ok',
        user: {
          username: 'testuser',
          profilePicUrl: 'https://example.com/pic.jpg'
        },
        items: [
          {
            id: '123',
            mediaType: 2,
            imageUrl: 'https://example.com/story1.jpg',
            videoUrl: 'https://example.com/story1.mp4',
            takenAt: 1609459200,
            expiringAt: 1609545600
          }
        ]
      };

      const storiesPromise = firstValueFrom(service.getStories('testuser'));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/profile/testuser/stories`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const response = await storiesPromise;
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.items.length).toBe(1);
      expect(response.status).toBe('ok');
    });

    it('should handle empty stories without throwing', async () => {
      const mockResponse: StoriesResponse = {
        status: 'ok',
        items: []
      };

      const storiesPromise = firstValueFrom(service.getStories('no_stories_user'));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/profile/no_stories_user/stories`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      const response = await storiesPromise;
      expect(Array.isArray(response.items)).toBe(true);
      expect(response.items.length).toBe(0);
    });
  });
});
