import { Component, input, computed, signal, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Router, ActivatedRoute } from '@angular/router';
import { switchMap, map, catchError, of, startWith } from 'rxjs';
import { ProfileApiService, ProfileDto, MediaInfoDto, CommentDto, StoryItem, StoryUser } from '../../services/profile-api.service';
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
  videoUrl?: string;
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
export class ProfileComponent implements OnInit {
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

  // Modal state signals (for Posts)
  selectedPostCode = signal<string | null>(null);
  post = signal<MediaInfoDto | null>(null);
  postLoading = signal(false);
  postError = signal<string | null>(null);
  comments = signal<CommentDto[]>([]);
  commentsCursor = signal<string | undefined>(undefined);
  commentsHasMore = signal(false);
  commentsLoading = signal(false);
  private postReqId = 0;

  // Reels Viewer state signals
  isReelViewerOpen = signal(false);
  reelViewerCode = signal<string | null>(null);
  reelViewerIndex = signal<number>(-1);
  
  // Reels Viewer resolved media signals
  reelResolvedVideoUrl = signal<string | null>(null);
  reelResolvedDisplayUrl = signal<string | null>(null);
  reelResolvedLoading = signal(false);
  reelResolvedError = signal<string | null>(null);
  private reelReqId = 0;

  // Stories Viewer state signals
  storiesOpen = signal(false);
  stories = signal<StoryItem[]>([]);
  storyIndex = signal(0);
  storiesLoading = signal(false);
  storiesError = signal<string | null>(null);
  storiesUser = signal<StoryUser | null>(null);

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
    private readonly highlightsApi: HighlightsApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    // Fetch highlights and load mock data when username changes
    effect(() => {
      const currentUsername = this.username();
      if (currentUsername) {
        this.fetchHighlights(currentUsername);
        this.loadMockedData();
      }
    });

    // Load posts/reels when username or selectedTab changes
    effect(() => {
      const currentUsername = this.username();
      const tab = this.selectedTab();
      
      if (currentUsername && tab === 'posts') {
        this.loadPosts({ reset: true });
      } else if (currentUsername && tab === 'reels') {
        this.loadReels({ reset: true });
      } else if (currentUsername && tab === 'tagged') {
        this.loadTagged({ reset: true });
      } else if (currentUsername && tab === 'reposts') {
        this.loadReposts({ reset: true });
      }
    });
  }

  ngOnInit(): void {
    // Check for deep-link to post or reel
    const code = this.route.snapshot.paramMap.get('code');
    const urlPath = this.route.snapshot.url.map(segment => segment.path).join('/');
    
    if (code && urlPath.includes('/post/')) {
      // Post deep-link
      this.openPost(code);
    } else if (code && urlPath.includes('/reel/')) {
      // Reel deep-link
      this.openReelViewerByCode(code);
    }
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
    } else if (this.selectedTab() === 'reels') {
      this.loadReels({ reset: false });
    } else if (this.selectedTab() === 'tagged') {
      this.loadTagged({ reset: false });
    } else if (this.selectedTab() === 'reposts') {
      this.loadReposts({ reset: false });
    }
  }

  async loadReels(opts: { reset: boolean }): Promise<void> {
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
      const response = await this.profileApi.getUserReels(currentUsername, cursor);

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
      this.tabError.set('Failed to load reels');
      this.isLoading.set(false);
    }
  }

  async loadTagged(opts: { reset: boolean }): Promise<void> {
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
      const response = await this.profileApi.getUserTagged(currentUsername, cursor);

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
      this.tabError.set('Failed to load tagged posts');
      this.isLoading.set(false);
    }
  }

  async loadReposts(opts: { reset: boolean }): Promise<void> {
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
      const response = await this.profileApi.getUserReposts(currentUsername, cursor);

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
      this.tabError.set('Failed to load reposts');
      this.isLoading.set(false);
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

  openPost(code: string): void {
    const reqId = ++this.postReqId;
    this.selectedPostCode.set(code);
    
    // Reset modal state
    this.post.set(null);
    this.postError.set(null);
    this.comments.set([]);
    this.commentsCursor.set(undefined);
    this.commentsHasMore.set(false);
    this.postLoading.set(true);
    this.commentsLoading.set(false);
    
    // Update URL without full navigation reload
    const currentUsername = this.username();
    this.router.navigate(['/profile', currentUsername, 'post', code], {
      replaceUrl: false,
    });

    // Load post data and comments
    this.loadPost(code, reqId);
    this.loadComments(code, { reset: true, reqId });
  }

  closePost(): void {
    // Invalidate any inflight requests
    this.postReqId++;
    
    this.selectedPostCode.set(null);
    this.post.set(null);
    this.postError.set(null);
    this.postLoading.set(false);
    this.comments.set([]);
    this.commentsCursor.set(undefined);
    this.commentsHasMore.set(false);
    this.commentsLoading.set(false);

    // Navigate back to profile page
    const currentUsername = this.username();
    this.router.navigate(['/profile', currentUsername]);
  }

  async loadPost(code: string, reqId: number): Promise<void> {
    if (!code) return;
    
    this.postLoading.set(true);
    this.postError.set(null);

    try {
      const mediaInfo = await this.profileApi.getMediaInfo(code);
      
      // Ignore stale response
      if (reqId !== this.postReqId) return;
      
      this.post.set(mediaInfo);
      this.postLoading.set(false);
    } catch (error) {
      // Ignore stale response
      if (reqId !== this.postReqId) return;
      
      this.postError.set('Failed to load post');
      this.postLoading.set(false);
    }
  }

  async loadComments(code: string, opts: { reset: boolean; reqId: number }): Promise<void> {
    if (!code) return;
    
    if (opts.reset) {
      this.comments.set([]);
      this.commentsCursor.set(undefined);
      this.commentsLoading.set(true);
    } else {
      if (!this.commentsHasMore() || this.commentsLoading()) return;
      this.commentsLoading.set(true);
    }

    try {
      const cursor = opts.reset ? undefined : this.commentsCursor();
      const response = await this.profileApi.getMediaComments(code, cursor);

      // Ignore stale response
      if (opts.reqId !== this.postReqId) return;

      if (opts.reset) {
        this.comments.set(response.comments);
      } else {
        this.comments.update(current => [...current, ...response.comments]);
      }

      this.commentsCursor.set(response.endCursor);
      this.commentsHasMore.set(response.hasMore);
      this.commentsLoading.set(false);
    } catch (error) {
      // Ignore stale response
      if (opts.reqId !== this.postReqId) return;
      
      this.commentsLoading.set(false);
    }
  }

  loadMoreComments(): void {
    // Get code from either post or reel viewer
    const code = this.selectedPostCode() || this.reelViewerCode();
    if (!code || this.commentsLoading() || !this.commentsHasMore()) {
      return;
    }
    
    const reqId = this.postReqId;
    this.loadComments(code, { reset: false, reqId });
  }

  // Reels Viewer Methods
  
  async resolveReelMedia(code: string): Promise<void> {
    const reqId = ++this.reelReqId;
    
    this.reelResolvedLoading.set(true);
    this.reelResolvedError.set(null);
    
    try {
      const mediaInfo = await this.profileApi.getMediaInfo(code);
      
      // Check if this request is still current
      if (reqId !== this.reelReqId) {
        return;
      }
      
      this.reelResolvedVideoUrl.set(mediaInfo.videoUrl || null);
      this.reelResolvedDisplayUrl.set(mediaInfo.displayUrl);
    } catch (error) {
      // Check if this request is still current
      if (reqId !== this.reelReqId) {
        return;
      }
      
      this.reelResolvedError.set('Failed to load reel media');
      console.error('[resolveReelMedia] Error:', error);
    } finally {
      // Check if this request is still current
      if (reqId === this.reelReqId) {
        this.reelResolvedLoading.set(false);
      }
    }
  }
  
  openReelViewerByItem(item: ProfileMediaItem): void {
    // Ensure we're on reels tab
    if (this.selectedTab() !== 'reels') {
      this.setTab('reels');
    }

    // Find index in current items
    const index = this.items().findIndex(i => i.code === item.code);
    if (index === -1) return;

    this.reelViewerIndex.set(index);
    this.reelViewerCode.set(item.code);
    this.isReelViewerOpen.set(true);

    // Update URL
    const currentUsername = this.username();
    this.router.navigate(['/profile', currentUsername, 'reel', item.code], {
      replaceUrl: false,
    });
    
    // Resolve media on-demand
    this.resolveReelMedia(item.code);
    
    // Load comments for reel
    const reqId = ++this.postReqId; // Reuse postReqId for request tracking
    this.comments.set([]);
    this.commentsCursor.set(undefined);
    this.commentsHasMore.set(false);
    this.commentsLoading.set(false);
    this.loadComments(item.code, { reset: true, reqId });
  }

  async openReelViewerByCode(code: string): Promise<void> {
    // Ensure we're on reels tab
    if (this.selectedTab() !== 'reels') {
      this.setTab('reels');
    }

    // Try to find in current items
    const index = this.items().findIndex(i => i.code === code);
    
    if (index !== -1) {
      // Found it
      const item = this.items()[index];
      console.log('[Reels Viewer]', {
        code: item.code,
        hasVideoUrl: !!item.videoUrl,
        videoUrlPreview: item.videoUrl?.substring(0, 60),
      });
      this.reelViewerIndex.set(index);
      this.reelViewerCode.set(code);
      this.isReelViewerOpen.set(true);

      // Update URL
      const currentUsername = this.username();
      this.router.navigate(['/profile', currentUsername, 'reel', code], {
        replaceUrl: false,
      });
      
      // Resolve media on-demand
      this.resolveReelMedia(code);
      
      // Load comments for reel
      const reqId = ++this.postReqId;
      this.comments.set([]);
      this.commentsCursor.set(undefined);
      this.commentsHasMore.set(false);
      this.commentsLoading.set(false);
      this.loadComments(code, { reset: true, reqId });
    } else {
      // Not in current items, need to load reels first
      await this.loadReels({ reset: true });
      
      // Try again after load
      const newIndex = this.items().findIndex(i => i.code === code);
      if (newIndex !== -1) {
        this.reelViewerIndex.set(newIndex);
        this.reelViewerCode.set(code);
        this.isReelViewerOpen.set(true);

        const currentUsername = this.username();
        this.router.navigate(['/profile', currentUsername, 'reel', code], {
          replaceUrl: false,
        });
        
        // Resolve media on-demand
        this.resolveReelMedia(code);
        
        // Load comments for reel
        const reqId = ++this.postReqId;
        this.comments.set([]);
        this.commentsCursor.set(undefined);
        this.commentsHasMore.set(false);
        this.commentsLoading.set(false);
        this.loadComments(code, { reset: true, reqId });
      } else {
        // Still not found - show error state
        this.tabError.set('Reel not found in loaded page');
      }
    }
  }

  closeReelViewer(): void {
    this.isReelViewerOpen.set(false);
    this.reelViewerCode.set(null);
    this.reelViewerIndex.set(-1);
    
    // Clear comments state
    this.comments.set([]);
    this.commentsCursor.set(undefined);
    this.commentsHasMore.set(false);
    this.commentsLoading.set(false);

    // Navigate back to profile (preserve reels tab)
    const currentUsername = this.username();
    this.router.navigate(['/profile', currentUsername]);
  }

  async nextReel(): Promise<void> {
    const currentIndex = this.reelViewerIndex();
    const allItems = this.items();
    
    if (currentIndex < allItems.length - 1) {
      // Move to next item
      const nextIndex = currentIndex + 1;
      const nextItem = allItems[nextIndex];
      
      this.reelViewerIndex.set(nextIndex);
      this.reelViewerCode.set(nextItem.code);

      // Update URL
      const currentUsername = this.username();
      this.router.navigate(['/profile', currentUsername, 'reel', nextItem.code], {
        replaceUrl: false,
      });
      
      // Resolve media on-demand
      this.resolveReelMedia(nextItem.code);
      
      // Load comments for next reel
      const reqId = ++this.postReqId;
      this.comments.set([]);
      this.commentsCursor.set(undefined);
      this.commentsHasMore.set(false);
      this.commentsLoading.set(false);
      this.loadComments(nextItem.code, { reset: true, reqId });
    } else if (this.moreAvailable() && !this.isLoading()) {
      // Load more reels
      await this.loadReels({ reset: false });
      
      // After loading, move to next item
      const newIndex = currentIndex + 1;
      const allItemsAfterLoad = this.items();
      
      if (newIndex < allItemsAfterLoad.length) {
        const nextItem = allItemsAfterLoad[newIndex];
        this.reelViewerIndex.set(newIndex);
        this.reelViewerCode.set(nextItem.code);

        const currentUsername = this.username();
        this.router.navigate(['/profile', currentUsername, 'reel', nextItem.code], {
          replaceUrl: false,
        });
        
        // Resolve media on-demand
        this.resolveReelMedia(nextItem.code);
        
        // Load comments for next reel
        const reqId = ++this.postReqId;
        this.comments.set([]);
        this.commentsCursor.set(undefined);
        this.commentsHasMore.set(false);
        this.commentsLoading.set(false);
        this.loadComments(nextItem.code, { reset: true, reqId });
      }
    }
  }

  prevReel(): void {
    const currentIndex = this.reelViewerIndex();
    
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      const prevItem = this.items()[prevIndex];
      
      this.reelViewerIndex.set(prevIndex);
      this.reelViewerCode.set(prevItem.code);

      // Update URL
      const currentUsername = this.username();
      this.router.navigate(['/profile', currentUsername, 'reel', prevItem.code], {
        replaceUrl: false,
      });
      
      // Resolve media on-demand
      this.resolveReelMedia(prevItem.code);
      
      // Load comments for previous reel
      const reqId = ++this.postReqId;
      this.comments.set([]);
      this.commentsCursor.set(undefined);
      this.commentsHasMore.set(false);
      this.commentsLoading.set(false);
      this.loadComments(prevItem.code, { reset: true, reqId });
    }
  }

  // Computed signal for current reel item
  currentReelItem = computed(() => {
    const index = this.reelViewerIndex();
    const allItems = this.items();
    return index >= 0 && index < allItems.length ? allItems[index] : null;
  });

  // Stories Viewer Methods
  
  async openStories(): Promise<void> {
    const currentUsername = this.username();
    if (!currentUsername) return;

    this.storiesOpen.set(true);
    this.storiesLoading.set(true);
    this.storiesError.set(null);
    this.storyIndex.set(0);

    try {
      const response = await this.profileApi.getUserStories(currentUsername);
      this.stories.set(response.items);
      this.storiesUser.set(response.user);
      this.storiesLoading.set(false);

      if (response.items.length === 0) {
        this.storiesError.set('No stories available');
      }
    } catch (error) {
      this.storiesError.set('Failed to load stories');
      this.storiesLoading.set(false);
      console.error('[openStories] Error:', error);
    }
  }

  closeStories(): void {
    this.storiesOpen.set(false);
    this.stories.set([]);
    this.storyIndex.set(0);
    this.storiesUser.set(null);
    this.storiesError.set(null);
  }

  nextStory(): void {
    const currentIndex = this.storyIndex();
    const totalStories = this.stories().length;
    
    if (currentIndex < totalStories - 1) {
      this.storyIndex.set(currentIndex + 1);
    } else {
      // At the end, close stories
      this.closeStories();
    }
  }

  prevStory(): void {
    const currentIndex = this.storyIndex();
    
    if (currentIndex > 0) {
      this.storyIndex.set(currentIndex - 1);
    }
  }

  // Computed signal for current story
  currentStory = computed(() => {
    const index = this.storyIndex();
    const allStories = this.stories();
    return index >= 0 && index < allStories.length ? allStories[index] : null;
  });
}

