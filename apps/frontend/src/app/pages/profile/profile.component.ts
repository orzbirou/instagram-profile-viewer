import { Component, input, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, catchError, of, startWith } from 'rxjs';
import { ProfileApiService, ProfileDto } from '../../services/profile-api.service';
import { HighlightsApiService, Highlight } from '../../services/highlights-api.service';
import type { ApiError } from '../../services/api-error';
import { ProfileHeaderComponent } from './components/profile-header/profile-header.component';
import { ProfileHighlightsComponent } from './components/profile-highlights/profile-highlights.component';
import { ProfilePostsGridComponent, Post } from './components/profile-posts-grid/profile-posts-grid.component';

type ProfileTab = 'posts' | 'reels' | 'tagged' | 'reposts';

interface ProfileMediaItem {
  code: string;
  displayUrl: string;
  mediaType?: number;
  likeCount?: number;
  commentCount?: number;
}

interface ProfileState {
  data: ProfileDto | null;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ProfileHeaderComponent, ProfileHighlightsComponent, ProfilePostsGridComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  username = input.required<string>();

  // Highlights state (signals-first approach)
  highlights = signal<Highlight[]>([]);
  highlightsLoading = signal<boolean>(false);
  highlightsError = signal<string | null>(null);

  // Tab navigation state (legacy - will be replaced)
  activeTab = signal<'posts' | 'reels' | 'tagged'>('posts');

  // Posts state (mocked data for UI-only implementation)
  posts = signal<Post[]>([]);
  postsLoading = signal<boolean>(true);

  // Reels state (mocked data)
  reels = signal<Post[]>([]);
  reelsLoading = signal<boolean>(true);

  // Tagged state (mocked data)
  tagged = signal<Post[]>([]);
  taggedLoading = signal<boolean>(true);

  // New signals-first tab state model
  selectedTab = signal<ProfileTab>('posts');
  items = signal<ProfileMediaItem[]>([]);
  isLoading = signal(false);
  tabError = signal<string | null>(null);
  endCursor = signal<string | undefined>(undefined);
  moreAvailable = signal(false);

  // Computed signals for active grid
  activeGridItems = computed(() => {
    const tab = this.activeTab();
    if (tab === 'reels') return this.reels();
    if (tab === 'tagged') return this.tagged();
    return this.posts();
  });

  activeGridLoading = computed(() => {
    const tab = this.activeTab();
    if (tab === 'reels') return this.reelsLoading();
    if (tab === 'tagged') return this.taggedLoading();
    return this.postsLoading();
  });

  // Reactive stream: username signal -> observable -> API call -> state signal
  private username$ = toObservable(this.username);

  private profileState = toSignal(
    this.username$.pipe(
      switchMap((username) =>
        this.profileApi.getProfile(username).pipe(
          map(
            (data): ProfileState => ({
              data,
              loading: false,
              error: null,
            })
          ),
          catchError((error: ApiError) => {
            const errorMessage = error.status === 429
              ? 'Rate limit exceeded. Please wait a second and try again.'
              : 'Failed to load data. Please try again.';
            return of({
              data: null,
              loading: false,
              error: errorMessage,
            });
          }),
          startWith({ data: null, loading: true, error: null })
        )
      )
    ),
    { initialValue: { data: null, loading: true, error: null } }
  );

  // Derived signals from state
  profile = computed(() => this.profileState()?.data ?? null);
  loading = computed(() => this.profileState()?.loading ?? false);
  error = computed(() => this.profileState()?.error ?? null);

  constructor(
    private readonly profileApi: ProfileApiService,
    private readonly highlightsApi: HighlightsApiService
  ) {
    // Fetch highlights and load mock data when username changes
    effect(() => {
      const currentUsername = this.username();
      if (currentUsername) {
        this.fetchHighlights(currentUsername);
        this.loadMockedData();
      }
    });

    // Load posts when username or selectedTab changes to 'posts'
    effect(() => {
      const currentUsername = this.username();
      const tab = this.selectedTab();
      
      if (currentUsername && tab === 'posts') {
        this.loadPosts({ reset: true });
      }
    });
  }

  private loadMockedData(): void {
    this.postsLoading.set(true);
    this.reelsLoading.set(true);
    this.taggedLoading.set(true);
    
    // Simulate loading delay (300-500ms)
    setTimeout(() => {
      // Mocked posts (standard square photos)
      const mockedPosts: Post[] = Array.from({ length: 12 }, (_, i) => ({
        id: `post-${i + 1}`,
        imageUrl: `https://picsum.photos/400/400?random=${i}`,
        likesCount: Math.floor(Math.random() * 50000) + 100,
        commentsCount: Math.floor(Math.random() * 1000) + 10,
      }));
      
      // Mocked reels (videos - higher engagement)
      const mockedReels: Post[] = Array.from({ length: 9 }, (_, i) => ({
        id: `reel-${i + 1}`,
        imageUrl: `https://picsum.photos/400/400?random=${i + 100}`,
        likesCount: Math.floor(Math.random() * 100000) + 500,
        commentsCount: Math.floor(Math.random() * 5000) + 50,
      }));
      
      // Mocked tagged posts (photos where user is tagged)
      const mockedTagged: Post[] = Array.from({ length: 6 }, (_, i) => ({
        id: `tagged-${i + 1}`,
        imageUrl: `https://picsum.photos/400/400?random=${i + 200}`,
        likesCount: Math.floor(Math.random() * 30000) + 200,
        commentsCount: Math.floor(Math.random() * 2000) + 20,
      }));
      
      this.posts.set(mockedPosts);
      this.reels.set(mockedReels);
      this.tagged.set(mockedTagged);
      
      this.postsLoading.set(false);
      this.reelsLoading.set(false);
      this.taggedLoading.set(false);
    }, 400);
  }

  switchTab(tab: 'posts' | 'reels' | 'tagged'): void {
    this.activeTab.set(tab);
  }

  setTab(tab: ProfileTab): void {
    this.selectedTab.set(tab);
    this.items.set([]);
    this.isLoading.set(false);
    this.tabError.set(null);
    this.endCursor.set(undefined);
    this.moreAvailable.set(false);
  }

  async loadPosts(opts: { reset: boolean }): Promise<void> {
    const currentUsername = this.username();
    if (!currentUsername) return;

    if (opts.reset) {
      this.items.set([]);
      this.endCursor.set(undefined);
      this.tabError.set(null);
      this.isLoading.set(true);
    } else {
      // Loading more
      if (!this.moreAvailable() || this.isLoading()) return;
      this.isLoading.set(true);
    }

    try {
      const cursor = opts.reset ? undefined : this.endCursor();
      const response = await this.profileApi.getUserPosts(currentUsername, cursor);

      // Map response items to ProfileMediaItem
      const newItems: ProfileMediaItem[] = response.items.map(item => ({
        code: item.code,
        displayUrl: item.displayUrl,
        mediaType: item.mediaType,
        likeCount: item.likeCount,
        commentCount: item.commentCount,
      }));

      if (opts.reset) {
        this.items.set(newItems);
      } else {
        this.items.update(current => [...current, ...newItems]);
      }

      this.endCursor.set(response.endCursor);
      this.moreAvailable.set(response.moreAvailable);
      this.isLoading.set(false);
    } catch (error) {
      this.tabError.set('Failed to load posts');
      this.isLoading.set(false);
    }
  }

  loadMore(): void {
    if (this.selectedTab() === 'posts') {
      this.loadPosts({ reset: false });
    }
  }

  private fetchHighlights(username: string): void {
    this.highlightsLoading.set(true);
    this.highlightsError.set(null);
    
    this.highlightsApi.getHighlights(username).subscribe({
      next: (response) => {
        this.highlights.set(response.highlights || []);
        this.highlightsLoading.set(false);
      },
      error: (error: ApiError) => {
        const errorMessage = error.status === 502
          ? 'Unable to load highlights'
          : 'Failed to load highlights';
        this.highlightsError.set(errorMessage);
        this.highlights.set([]);
        this.highlightsLoading.set(false);
      },
    });
  }

  retryHighlights(): void {
    const currentUsername = this.username();
    if (currentUsername) {
      this.fetchHighlights(currentUsername);
    }
  }
}
