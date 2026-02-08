export class HashtagFeedUserDto {
  username: string;
  full_name: string;
  profile_pic_url: string;
  is_verified: boolean;
}

export class HashtagFeedCarouselItemDto {
  display_url: string;
  video_url?: string;
  image_candidates_url?: string;
}

export class HashtagFeedItemDto {
  pk: string;
  code: string;
  display_url: string;
  image_candidates_url?: string;
  taken_at: number;
  like_count: number;
  comment_count: number;
  view_count?: number;
  play_count?: number;
  video_url?: string;
  carousel_media_count?: number;
  carousel_media?: HashtagFeedCarouselItemDto[];
  user: HashtagFeedUserDto;
}

export class HashtagFeedResponseDto {
  items: HashtagFeedItemDto[];
  more_available: boolean;
  end_cursor?: string;
}
