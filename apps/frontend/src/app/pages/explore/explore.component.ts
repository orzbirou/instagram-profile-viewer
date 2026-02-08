import { Component, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HashtagFeedApiService } from '../../services/hashtag-feed-api.service';
import type { HashtagFeedItem } from '../../models/hashtag-feed.model';
import type { ApiError } from '../../services/api-error';
import { ExploreGridComponent } from './components/explore-grid/explore-grid.component';
import { PostModalComponent } from './components/post-modal/post-modal.component';

@Component({
  selector: 'app-explore',
  standalone: true,
  imports: [CommonModule, FormsModule, ExploreGridComponent, PostModalComponent],
  templateUrl: './explore.component.html',
  styleUrl: './explore.component.scss',
})
export class ExploreComponent implements OnDestroy {
  // Search state
  hashtag = signal<string>('');
  feedType = signal<'recent' | 'top'>('recent');
  
  // Grid state
  items = signal<HashtagFeedItem[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<string | null>(null);
  
  // Pagination state
  moreAvailable = signal<boolean>(false);
  endCursor = signal<string | undefined>(undefined);
  isLoadingMore = signal<boolean>(false);
  
  // Modal state
  selectedItem = signal<HashtagFeedItem | null>(null);
  modalOpen = computed(() => this.selectedItem() !== null);
  
  // Intersection Observer for infinite scroll
  private observer: IntersectionObserver | null = null;
  private sentinelElement: HTMLElement | null = null;

  constructor(
    private readonly hashtagApi: HashtagFeedApiService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    // Handle deep linking to posts
    effect(() => {
      const postCode = this.route.snapshot.params['code'];
      const hashtagParam = this.route.snapshot.params['hashtag'];
      
      if (postCode && hashtagParam) {
        this.handleDeepLink(hashtagParam, postCode);
      }
    });
  }

  ngOnDestroy(): void {
    this.disconnectObserver();
  }

  onSearch(): void {
    const tag = this.hashtag().trim();
    if (!tag) {
      this.error.set('Please enter a hashtag');
      return;
    }

    // Reset state
    this.items.set([]);
    this.error.set(null);
    this.endCursor.set(undefined);
    this.moreAvailable.set(false);
    
    this.loadFeed(tag, this.feedType());
  }

  onFeedTypeChange(type: 'recent' | 'top'): void {
    this.feedType.set(type);
    if (this.hashtag().trim()) {
      this.onSearch();
    }
  }

  private loadFeed(hashtag: string, type: 'recent' | 'top', after?: string): void {
    const isFirstPage = !after;
    
    if (isFirstPage) {
      this.isLoading.set(true);
    } else {
      this.isLoadingMore.set(true);
    }

    this.hashtagApi.getHashtagFeed(hashtag, type, after).subscribe({
      next: (response) => {
        if (isFirstPage) {
          this.items.set(response.items);
          this.setupInfiniteScroll();
        } else {
          this.items.update(current => [...current, ...response.items]);
        }
        
        this.moreAvailable.set(response.more_available);
        this.endCursor.set(response.end_cursor);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
      error: (error: ApiError) => {
        const errorMessage = error.status === 429
          ? 'Rate limit exceeded. Please wait and try again.'
          : 'Failed to load hashtag feed. Please try again.';
        this.error.set(errorMessage);
        this.isLoading.set(false);
        this.isLoadingMore.set(false);
      },
    });
  }

  loadMore(): void {
    if (this.isLoadingMore() || !this.moreAvailable()) {
      return;
    }

    const cursor = this.endCursor();
    if (cursor) {
      this.loadFeed(this.hashtag(), this.feedType(), cursor);
    }
  }

  private setupInfiniteScroll(): void {
    // Wait for next tick to ensure DOM is updated
    setTimeout(() => {
      this.disconnectObserver();
      
      this.sentinelElement = document.querySelector('.scroll-sentinel');
      if (!this.sentinelElement) return;

      this.observer = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry.isIntersecting && this.moreAvailable() && !this.isLoadingMore()) {
            this.loadMore();
          }
        },
        { rootMargin: '200px' }
      );

      this.observer.observe(this.sentinelElement);
    }, 100);
  }

  private disconnectObserver(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  onItemClick(item: HashtagFeedItem): void {
    this.selectedItem.set(item);
    // Update URL with deep link
    this.router.navigate(['/explore', 'hashtag', this.hashtag(), 'post', item.code || item.pk], {
      skipLocationChange: false,
    });
  }

  onCloseModal(): void {
    this.selectedItem.set(null);
    // Navigate back to explore without post
    this.router.navigate(['/explore'], {
      skipLocationChange: false,
    });
  }

  private async handleDeepLink(hashtag: string, postCode: string): Promise<void> {
    this.hashtag.set(hashtag);
    
    // Load first page
    await this.loadFirstPageAndFindPost(hashtag, postCode);
  }

  private loadFirstPageAndFindPost(hashtag: string, postCode: string, maxPages: number = 5): void {
    this.loadFeedAndSearch(hashtag, this.feedType(), postCode, 0, maxPages);
  }

  private loadFeedAndSearch(
    hashtag: string,
    type: 'recent' | 'top',
    postCode: string,
    currentPage: number,
    maxPages: number,
    after?: string
  ): void {
    this.hashtagApi.getHashtagFeed(hashtag, type, after).subscribe({
      next: (response) => {
        const allItems = [...this.items(), ...response.items];
        this.items.set(allItems);
        
        // Try to find the post
        const foundItem = allItems.find(item => item.code === postCode || item.pk === postCode);
        
        if (foundItem) {
          this.selectedItem.set(foundItem);
          this.moreAvailable.set(response.more_available);
          this.endCursor.set(response.end_cursor);
        } else if (response.more_available && currentPage < maxPages && response.end_cursor) {
          // Load next page
          this.loadFeedAndSearch(hashtag, type, postCode, currentPage + 1, maxPages, response.end_cursor);
        } else {
          // Not found after max pages, just show the feed
          this.moreAvailable.set(response.more_available);
          this.endCursor.set(response.end_cursor);
        }
      },
      error: () => {
        this.error.set('Failed to load post');
      },
    });
  }
}
