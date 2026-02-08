import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import type { ApiError } from './api-error';

export interface Highlight {
  id: string;
  title: string;
  coverUrl?: string;
  itemsCount: number;
}

export interface HighlightsResponse {
  highlights: Highlight[];
}

@Injectable({
  providedIn: 'root',
})
export class HighlightsApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  getHighlights(username: string): Observable<HighlightsResponse> {
    const fullUrl = `${this.apiBaseUrl}/profile/${username}/highlights`;
    
    return this.http
      .get<HighlightsResponse>(fullUrl)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    const apiError: ApiError = {
      message: error.error?.message || error.message || 'An error occurred',
      status: error.status,
    };
    return throwError(() => apiError);
  }
}
