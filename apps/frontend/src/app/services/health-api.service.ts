import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface HealthResponse {
  status: string;
}

@Injectable({
  providedIn: 'root',
})
export class HealthApiService {
  private readonly apiBaseUrl = environment.apiBaseUrl;

  constructor(private readonly http: HttpClient) {}

  async checkHealth(): Promise<HealthResponse> {
    return firstValueFrom(
      this.http.get<HealthResponse>(`${this.apiBaseUrl}/health`)
    );
  }
}
