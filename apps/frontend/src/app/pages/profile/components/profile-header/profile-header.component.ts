import { Component, input } from '@angular/core';
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
  
  // Expose encodeURIComponent for template use
  readonly encodeURIComponent = encodeURIComponent;
}
