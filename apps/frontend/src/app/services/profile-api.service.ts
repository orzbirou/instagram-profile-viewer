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
}
