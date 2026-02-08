import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import type { ApiError } from './api-error';

export interface ProfileDto {
  username: string;
  fullName: string;
  bio: string;
  profilePicUrl: string;
  posts: number;
  followers: number;
  following: number;
}

export interface UserPostItem {
  code: string;
  displayUrl: string;
  mediaType?: number;
  likeCount?: number;
  commentCount?: number;
}

export interface UserPostsResponse {
  status: string;
  items: UserPostItem[];
  endCursor?: string;
  moreAvailable: boolean;
}

export interface MediaInfoUser {
  username: string;
  profilePicUrl: string;
}

export interface MediaInfoCarouselItem {
  displayUrl: string;
  videoUrl?: string;
  mediaType: string;
}

export interface MediaInfoDto {
  code: string;
  captionText: string;
  takenAt: number;
  mediaType: string;
  displayUrl: string;
  videoUrl?: string;
  user: MediaInfoUser;
  likeCount: number;
  commentCount: number;
  carousel?: MediaInfoCarouselItem[];
}

export interface CommentUser {
  username: string;
  profilePicUrl: string;
}

export interface CommentDto {
  id: string;
  text: string;
  createdAt: number;
  likeCount: number;
  user: CommentUser;
}

export interface CommentsPageDto {
  comments: CommentDto[];
  endCursor?: string;
  hasMore: boolean;
}

export interface StoryUser {
  username: string;
  profilePicUrl: string;
}

export interface StoryItem {
  id: string;
  mediaType: number;
  imageUrl: string;
  videoUrl?: string;
  takenAt: number;
  expiringAt: number;
}

export interface UserStoriesDto {
  status: string;
  user: StoryUser;
  items: StoryItem[];
}

@Injectable({
  providedIn: 'root',
})
export class ProfileApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getProfile(username: string): Observable<ProfileDto> {
    return this.http
      .get<ProfileDto>(`${this.apiBaseUrl}/profile/${username}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          const apiError: ApiError = {
            status: error.status,
            message: error.error?.message || error.message || 'Unknown error',
          };
          return throwError(() => apiError);
        })
      );
  }

  async getUserPosts(
    username: string,
    after?: string
  ): Promise<UserPostsResponse> {
    try {
      let url = `${this.apiBaseUrl}/profile/${username}/posts`;
      if (after) {
        url += `?after=${encodeURIComponent(after)}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getUserReels(
    username: string,
    after?: string
  ): Promise<UserPostsResponse> {
    try {
      let url = `${this.apiBaseUrl}/profile/${username}/reels`;
      if (after) {
        url += `?after=${encodeURIComponent(after)}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getUserTagged(
    username: string,
    after?: string
  ): Promise<UserPostsResponse> {
    try {
      let url = `${this.apiBaseUrl}/profile/${username}/tagged`;
      if (after) {
        url += `?after=${encodeURIComponent(after)}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getUserReposts(
    username: string,
    after?: string
  ): Promise<UserPostsResponse> {
    try {
      let url = `${this.apiBaseUrl}/profile/${username}/reposts`;
      if (after) {
        url += `?after=${encodeURIComponent(after)}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getMediaInfo(code: string): Promise<MediaInfoDto> {
    try {
      const url = `${this.apiBaseUrl}/media/${code}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getMediaComments(
    code: string,
    after?: string
  ): Promise<CommentsPageDto> {
    try {
      let url = `${this.apiBaseUrl}/media/${code}/comments`;
      if (after) {
        url += `?after=${encodeURIComponent(after)}`;
      }

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async getUserStories(username: string): Promise<UserStoriesDto> {
    try {
      const url = `${this.apiBaseUrl}/profile/${username}/stories`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}
