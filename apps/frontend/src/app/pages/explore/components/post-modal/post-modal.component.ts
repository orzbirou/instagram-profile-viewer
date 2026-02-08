import { Component, input, output, signal, HostListener, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { HashtagFeedItem, HashtagFeedCarouselItem } from '../../../../models/hashtag-feed.model';

@Component({
  selector: 'app-post-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './post-modal.component.html',
  styleUrl: './post-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PostModalComponent {
  item = input.required<HashtagFeedItem>();
  close = output<void>();

  currentCarouselIndex = signal<number>(0);

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  hasCarousel(): boolean {
    const currentItem = this.item();
    return (currentItem.carousel_media?.length || 0) > 0;
  }

  getCurrentMedia(): HashtagFeedCarouselItem | null {
    const currentItem = this.item();
    if (!currentItem.carousel_media) return null;
    return currentItem.carousel_media[this.currentCarouselIndex()] || null;
  }

  nextCarouselItem(): void {
    const currentItem = this.item();
    if (!currentItem.carousel_media) return;
    
    const maxIndex = currentItem.carousel_media.length - 1;
    this.currentCarouselIndex.update(i => (i < maxIndex ? i + 1 : i));
  }

  prevCarouselItem(): void {
    this.currentCarouselIndex.update(i => (i > 0 ? i - 1 : i));
  }

  canGoPrev(): boolean {
    return this.currentCarouselIndex() > 0;
  }

  canGoNext(): boolean {
    const currentItem = this.item();
    if (!currentItem.carousel_media) return false;
    return this.currentCarouselIndex() < currentItem.carousel_media.length - 1;
  }

  getMediaUrl(): string {
    const currentItem = this.item();
    if (this.hasCarousel()) {
      const media = this.getCurrentMedia();
      return media?.display_url || media?.image_candidates_url || '';
    }
    return currentItem.display_url || currentItem.image_candidates_url || '';
  }

  getVideoUrl(): string | undefined {
    const currentItem = this.item();
    if (this.hasCarousel()) {
      const media = this.getCurrentMedia();
      return media?.video_url;
    }
    return currentItem.video_url;
  }

  formatCount(count: number): string {
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return count.toString();
  }

  formatDate(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getCaption(): string {
    const currentItem = this.item();
    // Caption would typically be in item.caption.text
    // For now, return empty as it's not in our DTO
    return '';
  }
}
