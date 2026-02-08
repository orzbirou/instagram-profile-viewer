import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import type { HashtagFeedResponse } from '../models/hashtag-feed.model';

@Injectable({
  providedIn: 'root',
})
export class HashtagFeedApiService {
  private readonly apiUrl = `${environment.apiBaseUrl}/ig/hashtag-feed`;

  constructor(private readonly http: HttpClient) {}

  getHashtagFeed(
    hashtag: string,
    type: 'recent' | 'top' = 'recent',
    after?: string
  ): Observable<HashtagFeedResponse> {
    let params = new HttpParams()
      .set('hashtag', hashtag)
      .set('type', type);

    if (after) {
      params = params.set('after', after);
    }

    return this.http.get<HashtagFeedResponse>(this.apiUrl, { params });
  }
}
