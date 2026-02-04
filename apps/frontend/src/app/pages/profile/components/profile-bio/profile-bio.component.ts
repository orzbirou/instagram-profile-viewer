import { Component, input } from '@angular/core';

@Component({
  selector: 'app-profile-bio',
  standalone: true,
  templateUrl: './profile-bio.component.html',
  styleUrl: './profile-bio.component.scss',
})
export class ProfileBioComponent {
  fullName = input.required<string>();
  bio = input.required<string>();
}
