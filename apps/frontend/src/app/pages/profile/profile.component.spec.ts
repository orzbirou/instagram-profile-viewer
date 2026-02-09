import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileComponent } from './profile.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProfileApiService, ProfileDto } from '../../services/profile-api.service';
import { HighlightsApiService } from '../../services/highlights-api.service';
import { SearchApiService } from '../../services/search-api.service';
import { vi } from 'vitest';

describe('ProfileComponent', () => {
  let component: ProfileComponent;
  let fixture: ComponentFixture<ProfileComponent>;
  let profileApiService: any;
  let highlightsApiService: any;
  let searchApiService: any;

  const mockProfile: ProfileDto = {
    username: 'instagram',
    fullName: 'Instagram',
    bio: 'Test bio',
    profilePicUrl: 'https://example.com/pic.jpg',
    posts: 100,
    followers: 1000000,
    following: 50
  };

  beforeEach(async () => {
    // Create mock services with Vitest
    const profileApiSpy = {
      getProfile: vi.fn().mockReturnValue(of(mockProfile)),
      getUserPosts: vi.fn().mockResolvedValue({
        status: 'ok',
        items: [
          { code: 'POST1', displayUrl: 'https://example.com/1.jpg', mediaType: 1, likeCount: 100, commentCount: 10 },
          { code: 'POST2', displayUrl: 'https://example.com/2.jpg', mediaType: 1, likeCount: 200, commentCount: 20 }
        ],
        endCursor: 'CURSOR_1',
        moreAvailable: true
      }),
      getUserTagged: vi.fn().mockResolvedValue({
        status: 'ok',
        items: [
          { code: 'TAG1', displayUrl: 'https://example.com/t1.jpg', mediaType: 1, likeCount: 50, commentCount: 5 }
        ],
        endCursor: undefined,
        moreAvailable: false
      }),
      getUserReels: vi.fn().mockResolvedValue({
        status: 'ok',
        items: [
          { code: 'REEL1', displayUrl: 'https://example.com/r1.jpg', mediaType: 2, likeCount: 300, commentCount: 30 }
        ],
        endCursor: 'REEL_CURSOR',
        moreAvailable: true
      }),
      getUserReposts: vi.fn()
    };

    const highlightsApiSpy = {
      getHighlights: vi.fn().mockReturnValue(of({ 
        highlights: [{ id: 'h1', title: 'Trip', coverUrl: 'https://example.com/h.jpg', itemsCount: 3 }] 
      })),
      getStories: vi.fn()
    };

    const searchApiSpy = {
      search: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ProfileApiService, useValue: profileApiSpy },
        { provide: HighlightsApiService, useValue: highlightsApiSpy },
        { provide: SearchApiService, useValue: searchApiSpy }
      ],
    }).compileComponents();

    profileApiService = TestBed.inject(ProfileApiService);
    highlightsApiService = TestBed.inject(HighlightsApiService);
    searchApiService = TestBed.inject(SearchApiService);

    fixture = TestBed.createComponent(ProfileComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads instagram profile on init', async () => {
    // Set username input
    fixture.componentRef.setInput('username', 'instagram');
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify profile API was called
    expect(profileApiService.getProfile).toHaveBeenCalledWith('instagram');
    
    // Verify highlights API was called
    expect(highlightsApiService.getHighlights).toHaveBeenCalledWith('instagram');
    
    // Verify posts were loaded (default tab)
    expect(profileApiService.getUserPosts).toHaveBeenCalledWith('instagram', undefined);
  });

  it('switching to TAGGED triggers tagged fetch', async () => {
    // Setup: set username and wait for initial load
    fixture.componentRef.setInput('username', 'instagram');
    fixture.detectChanges();
    await fixture.whenStable();

    // Reset spy to track new calls
    profileApiService.getUserTagged.mockClear();

    // Action: switch to tagged tab
    component.setTab('tagged');
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify tagged API was called
    expect(profileApiService.getUserTagged).toHaveBeenCalledWith('instagram', undefined);
    
    // Verify items were populated
    expect(component.items().length).toBeGreaterThan(0);
  });

  it('infinite scroll triggers load more when moreAvailable is true', async () => {
    // Setup: set username and wait for initial posts load
    fixture.componentRef.setInput('username', 'instagram');
    component.setTab('posts');
    fixture.detectChanges();
    await fixture.whenStable();

    // Verify initial load happened
    expect(profileApiService.getUserPosts).toHaveBeenCalledTimes(1);
    expect(component.moreAvailable()).toBe(true);
    expect(component.endCursor()).toBe('CURSOR_1');

    // Reset spy and setup next page response
    profileApiService.getUserPosts.mockClear();
    profileApiService.getUserPosts.mockResolvedValue({
      status: 'ok',
      items: [
        { code: 'POST3', displayUrl: 'https://example.com/3.jpg', mediaType: 1, likeCount: 150, commentCount: 15 }
      ],
      endCursor: undefined,
      moreAvailable: false
    });

    // Action: trigger load more directly (simulating scroll)
    await component.loadPosts({ reset: false });
    await fixture.whenStable();

    // Verify load more was called with cursor
    expect(profileApiService.getUserPosts).toHaveBeenCalledWith('instagram', 'CURSOR_1');
    
    // Verify items were appended (not replaced)
    expect(component.items().length).toBe(3); // 2 from initial + 1 from load more
    expect(component.moreAvailable()).toBe(false);
  });
});
