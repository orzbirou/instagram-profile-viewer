import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ProfileApiService } from './profile-api.service';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

describe('ProfileApiService', () => {
  let service: ProfileApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ProfileApiService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ProfileApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getProfile', () => {
    it('should return profile data for a username', async () => {
      const mockProfile = {
        username: 'testuser',
        fullName: 'Test User',
        bio: 'Test bio',
        profilePicUrl: 'https://example.com/pic.jpg',
        posts: 100,
        followers: 1000,
        following: 200
      };

      const profilePromise = firstValueFrom(service.getProfile('testuser'));

      const req = httpMock.expectOne(`${environment.apiBaseUrl}/profile/testuser`);
      expect(req.request.method).toBe('GET');
      req.flush(mockProfile);

      const profile = await profilePromise;
      expect(profile.username).toBe('testuser');
      expect(profile.fullName).toBe('Test User');
      expect(profile.posts).toBe(100);
      expect(profile.followers).toBe(1000);
    });
  });
});
