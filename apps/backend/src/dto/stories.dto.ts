export class StoryUserDto {
  username: string;
  profilePicUrl: string;
}

export class StoryItemDto {
  id: string;
  mediaType: number;
  imageUrl: string;
  videoUrl?: string;
  takenAt: number;
  expiringAt: number;
}

export class UserStoriesResponseDto {
  status: string;
  user: StoryUserDto;
  items: StoryItemDto[];
}
