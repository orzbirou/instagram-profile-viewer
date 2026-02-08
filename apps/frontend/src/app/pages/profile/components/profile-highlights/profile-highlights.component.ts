import { Component, input, output, ChangeDetectionStrategy } from '@angular/core';
import type { Highlight } from '../../../../services/highlights-api.service';

/**
 * Profile Highlights Component
 * 
 * Displays Instagram-like story highlights for a user profile.
 * 
 * Manual Testing Checklist:
 * -------------------------
 * 1. Navigate to a profile page (e.g., /profile/cristiano)
 * 2. Verify highlights section appears below profile header
 * 3. Loading state:
 *    - Should show 4 skeleton circles with pulsing animation
 *    - No flicker or layout shift
 * 4. Success state:
 *    - Highlights display in horizontal scrollable row
 *    - Each highlight has circular cover image (64x64px)
 *    - Title appears below each circle
 *    - Gradient border (Instagram-like)
 *    - Smooth hover effects
 * 5. Empty state:
 *    - Should show "No highlights" message if user has none
 * 6. Error state:
 *    - Should show compact error message if fetch fails
 *    - Should not block rest of profile from rendering
 * 7. Responsive:
 *    - Mobile: horizontal scroll without scrollbar
 *    - Desktop: can wrap or scroll
 * 8. Performance:
 *    - No unnecessary re-renders
 *    - Images lazy load
 *    - TrackBy prevents DOM recreation
 */
@Component({
  selector: 'app-profile-highlights',
  standalone: true,
  templateUrl: './profile-highlights.component.html',
  styleUrl: './profile-highlights.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileHighlightsComponent {
  highlights = input.required<Highlight[]>();
  isLoading = input<boolean>(false);
  error = input<string | null>(null);
  retry = output<void>();

  trackById(index: number, item: Highlight): string {
    return item.id;
  }

  onRetry(): void {
    this.retry.emit();
  }
}
