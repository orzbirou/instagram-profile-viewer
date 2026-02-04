import { Component, signal, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { HealthApiService } from '../../services/health-api.service';
import { SearchApiService } from '../../services/search-api.service';
import type { ApiError } from '../../services/api-error';
import { SearchInputComponent } from './components/search-input/search-input.component';
import { SearchResultsDropdownComponent } from './components/search-results-dropdown/search-results-dropdown.component';

interface SearchState {
  results: string[];
  error: string | null;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SearchInputComponent, SearchResultsDropdownComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  searchTerm = signal<string>('');
  isDropdownOpen = computed(() => this.searchTerm().length > 0);
  
  statusMessage = '';

  // RxJS stream: signal -> observable -> debounce -> API -> signal
  private searchTerm$ = toObservable(this.searchTerm);
  
  private searchState = toSignal(
    this.searchTerm$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term) => {
        if (!term || term.trim().length === 0) {
          return of({ results: [], error: null });
        }
        return this.searchApi.search(term).pipe(
          switchMap((results) => of({ results, error: null })),
          catchError((error: ApiError) => {
            const errorMessage = error.status === 429
              ? 'Rate limit exceeded. Please wait a second and try again.'
              : 'Failed to load data. Please try again.';
            return of({ results: [], error: errorMessage });
          })
        );
      })
    ),
    { initialValue: { results: [], error: null } }
  );

  searchResults = computed(() => this.searchState()?.results ?? []);
  searchError = computed(() => this.searchState()?.error ?? null);

  constructor(
    private readonly healthApi: HealthApiService,
    private readonly searchApi: SearchApiService
  ) {}

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
  }

  onSelectUsername(username: string): void {
    // TODO: Navigate to profile page when selected
    console.log('Selected username:', username);
  }

  async checkBackend(): Promise<void> {
    try {
      const response = await this.healthApi.checkHealth();
      this.statusMessage = `Backend status: ${response.status}`;
    } catch (error) {
      this.statusMessage = 'Error: Could not reach backend';
      console.error('Health check failed:', error);
    }
  }
}
