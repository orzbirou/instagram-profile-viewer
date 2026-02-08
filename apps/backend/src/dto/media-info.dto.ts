export class MediaInfoUserDto {
  username: string;
  profilePicUrl: string;
}

export class MediaInfoCarouselItemDto {
  displayUrl: string;
  videoUrl?: string;
  mediaType: string;
}

export class MediaInfoDto {
  code: string;
  captionText: string;
  takenAt: number;
  mediaType: string;
  displayUrl: string;
  videoUrl?: string;
  user: MediaInfoUserDto;
  likeCount: number;
  commentCount: number;
  carousel?: MediaInfoCarouselItemDto[];
}
