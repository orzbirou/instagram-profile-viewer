import { Component, input, computed } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { switchMap, map, catchError, of, startWith } from 'rxjs';
import { ProfileApiService, ProfileDto } from '../../services/profile-api.service';
import type { ApiError } from '../../services/api-error';
import { ProfileHeaderComponent } from './components/profile-header/profile-header.component';

interface ProfileState {
  data: ProfileDto | null;
  loading: boolean;
  error: string | null;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [ProfileHeaderComponent],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  username = input.required<string>();

  // Reactive stream: username signal -> observable -> API call -> state signal
  private username$ = toObservable(this.username);

  private profileState = toSignal(
    this.username$.pipe(
      switchMap((username) =>
        this.profileApi.getProfile(username).pipe(
          map(
            (data): ProfileState => ({
              data,
              loading: false,
              error: null,
            })
          ),
          catchError((error: ApiError) => {
            const errorMessage = error.status === 429
              ? 'Rate limit exceeded. Please wait a second and try again.'
              : 'Failed to load data. Please try again.';
            return of({
              data: null,
              loading: false,
              error: errorMessage,
            });
          }),
          startWith({ data: null, loading: true, error: null })
        )
      )
    ),
    { initialValue: { data: null, loading: true, error: null } }
  );

  // Derived signals from state
  profile = computed(() => this.profileState()?.data ?? null);
  loading = computed(() => this.profileState()?.loading ?? false);
  error = computed(() => this.profileState()?.error ?? null);

  constructor(private readonly profileApi: ProfileApiService) {}
}
