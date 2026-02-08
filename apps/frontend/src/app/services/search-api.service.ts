import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import type { ApiError } from './api-error';

export interface SearchUserResult {
  username: string;
  fullName?: string;
  profilePicUrl?: string;
  isVerified?: boolean;
  followersCount?: number;
}

export interface SearchResponse {
  users: SearchUserResult[];
}

@Injectable({
  providedIn: 'root',
})
export class SearchApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  search(query: string): Observable<SearchResponse> {
    return this.http
      .get<SearchResponse>(`${this.apiBaseUrl}/search`, {
        params: { query },
      })
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
