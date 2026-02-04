import { Component, input } from '@angular/core';

@Component({
  selector: 'app-profile-stats',
  standalone: true,
  templateUrl: './profile-stats.component.html',
  styleUrl: './profile-stats.component.scss',
})
export class ProfileStatsComponent {
  posts = input.required<number>();
  followers = input.required<number>();
  following = input.required<number>();
}
