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

export interface StoryItem {
  id: string;
  mediaType: number;
  imageUrl: string;
  videoUrl?: string;
  takenAt: number;
  expiringAt: number;
}

export interface StoryUser {
  username: string;
  profilePicUrl: string;
}

export interface StoriesResponse {
  status?: string;
  user?: StoryUser;
  items: StoryItem[];
  unavailable?: boolean;
  reason?: string;
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

  getStories(username: string): Observable<StoriesResponse> {
    const fullUrl = `${this.apiBaseUrl}/profile/${username}/stories`;
    
    return this.http
      .get<StoriesResponse>(fullUrl)
      .pipe(catchError(this.handleError));
  }

  getHighlightItems(highlightId: string): Observable<StoriesResponse> {
    const fullUrl = `${this.apiBaseUrl}/highlights/${highlightId}/items`;
    
    return this.http
      .get<StoriesResponse>(fullUrl)
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
