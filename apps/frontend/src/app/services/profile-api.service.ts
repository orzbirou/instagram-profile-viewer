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
}
