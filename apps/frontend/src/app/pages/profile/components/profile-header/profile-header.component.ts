import { Component, input, output } from '@angular/core';
import { ProfileDto } from '../../../../services/profile-api.service';
import { ProfileStatsComponent } from '../profile-stats/profile-stats.component';
import { ProfileBioComponent } from '../profile-bio/profile-bio.component';

@Component({
  selector: 'app-profile-header',
  standalone: true,
  imports: [ProfileStatsComponent, ProfileBioComponent],
  templateUrl: './profile-header.component.html',
  styleUrl: './profile-header.component.scss',
})
export class ProfileHeaderComponent {
  profile = input.required<ProfileDto>();
  
  // Event emitter for profile picture click (opens Stories)
  profilePictureClick = output<void>();
  
  // Expose encodeURIComponent for template use
  readonly encodeURIComponent = encodeURIComponent;

  onProfilePictureClick(): void {
    this.profilePictureClick.emit();
  }

  onProfilePictureKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.profilePictureClick.emit();
    }
  }
}
