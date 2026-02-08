export class UserPostItemDto {
  code: string;
  displayUrl: string;
  mediaType?: number;
  likeCount?: number;
  commentCount?: number;
  videoUrl?: string;
}

export class UserPostsResponseDto {
  status: string;
  items: UserPostItemDto[];
  endCursor?: string;
  moreAvailable: boolean;
}
