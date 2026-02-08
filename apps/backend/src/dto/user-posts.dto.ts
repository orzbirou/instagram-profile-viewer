export class UserPostItemDto {
  code: string;
  displayUrl: string;
  mediaType?: number;
  likeCount?: number;
  commentCount?: number;
}

export class UserPostsResponseDto {
  status: string;
  items: UserPostItemDto[];
  endCursor?: string;
  moreAvailable: boolean;
}
