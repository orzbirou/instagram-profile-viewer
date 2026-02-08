import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Post {
  id: string;
  imageUrl: string;
  likesCount: number;
  commentsCount: number;
}

@Component({
  selector: 'app-profile-posts-grid',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile-posts-grid.component.html',
  styleUrl: './profile-posts-grid.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePostsGridComponent {
  posts = input.required<Post[]>();
  isLoading = input<boolean>(false);

  trackById(index: number, post: Post): string {
    return post.id;
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
}
