import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { HashtagFeedItem } from '../../../../models/hashtag-feed.model';

@Component({
  selector: 'app-explore-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './explore-grid.component.html',
  styleUrl: './explore-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExploreGridComponent {
  items = input.required<HashtagFeedItem[]>();
  itemClick = output<HashtagFeedItem>();

  onItemClick(item: HashtagFeedItem): void {
    this.itemClick.emit(item);
  }

  trackByCode(index: number, item: HashtagFeedItem): string {
    return item.code || item.pk;
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

  getImageUrl(item: HashtagFeedItem): string {
    return item.display_url || item.image_candidates_url || '';
  }

  hasCarousel(item: HashtagFeedItem): boolean {
    return (item.carousel_media_count || 0) > 0 || (item.carousel_media?.length || 0) > 0;
  }

  hasVideo(item: HashtagFeedItem): boolean {
    return !!item.video_url;
  }

  getVideoViews(item: HashtagFeedItem): number | undefined {
    return item.view_count || item.play_count;
  }
}
