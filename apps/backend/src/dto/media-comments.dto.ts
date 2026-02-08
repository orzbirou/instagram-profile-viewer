export class CommentUserDto {
  username: string;
  profilePicUrl: string;
}

export class CommentDto {
  id: string;
  text: string;
  createdAt: number;
  likeCount: number;
  user: CommentUserDto;
}

export class MediaCommentsResponseDto {
  comments: CommentDto[];
  endCursor?: string;
  hasMore: boolean;
}
