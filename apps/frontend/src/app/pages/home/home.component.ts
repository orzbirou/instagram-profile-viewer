import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, switchMap, catchError, of, tap } from 'rxjs';
import { SearchApiService, SearchUserResult, SearchResponse } from '../../services/search-api.service';
import type { ApiError } from '../../services/api-error';
import { SearchInputComponent } from './components/search-input/search-input.component';
import { SearchResultsDropdownComponent } from './components/search-results-dropdown/search-results-dropdown.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [SearchInputComponent, SearchResultsDropdownComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  searchTerm = signal<string>('');
  searchResults = signal<SearchUserResult[]>([]);
  searchError = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  
  // In-memory cache for search results (query -> response)
  private searchCache = new Map<string, SearchResponse>();

  constructor(
    private readonly searchApi: SearchApiService,
    private readonly router: Router
  ) {
    // Set up reactive search with debouncing and caching
    const searchTerm$ = toObservable(this.searchTerm);
    
    searchTerm$.pipe(
      debounceTime(250), // Fast response: 250ms debounce
      distinctUntilChanged(), // Ignore repeated queries
      switchMap((term) => {
        const trimmedTerm = term?.trim() || '';
        
        // Clear results if query is too short
        if (trimmedTerm.length < 2) {
          this.searchResults.set([]);
          this.searchError.set(null);
          this.isLoading.set(false);
          return of(null);
        }
        
        // Check cache first (instant response)
        const cached = this.searchCache.get(trimmedTerm.toLowerCase());
        if (cached) {
          this.searchResults.set(cached.users);
          this.searchError.set(null);
          this.isLoading.set(false);
          return of(null);
        }
        
        // Show loading but keep previous results (no flicker)
        this.isLoading.set(true);
        this.searchError.set(null);
        
        return this.searchApi.search(trimmedTerm).pipe(
          tap((response) => {
            // Cache successful responses
            if (response && response.users) {
              this.searchCache.set(trimmedTerm.toLowerCase(), response);
            }
          }),
          catchError((error: ApiError) => {
            const errorMessage = error.status === 429
              ? 'Rate limit exceeded. Please wait a second and try again.'
              : 'Failed to load data. Please try again.';
            this.searchError.set(errorMessage);
            this.searchResults.set([]);
            return of(null);
          })
        );
      })
    ).subscribe((response) => {
      this.isLoading.set(false);
      if (response && response.users) {
        this.searchResults.set(response.users);
      }
    });
  }

  onSearchTermChange(value: string): void {
    this.searchTerm.set(value);
  }

  onSelectUsername(username: string): void {
    // Clear search input and close dropdown
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.searchError.set(null);
    
    // Navigate to profile page
    this.router.navigate(['/profile', username]);
  }

  onCloseDropdown(): void {
    // Close dropdown by clearing search
    this.searchTerm.set('');
    this.searchResults.set([]);
    this.searchError.set(null);
  }
}
