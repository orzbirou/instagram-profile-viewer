export interface HashtagFeedUser {
  username: string;
  full_name: string;
  profile_pic_url: string;
  is_verified: boolean;
}

export interface HashtagFeedCarouselItem {
  display_url: string;
  video_url?: string;
  image_candidates_url?: string;
}

export interface HashtagFeedItem {
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
  carousel_media?: HashtagFeedCarouselItem[];
  user: HashtagFeedUser;
}

export interface HashtagFeedResponse {
  items: HashtagFeedItem[];
  more_available: boolean;
  end_cursor?: string;
}
