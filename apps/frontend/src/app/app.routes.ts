import { Routes } from '@angular/router';
import { ProfileComponent } from './pages/profile/profile.component';
import { ExploreComponent } from './pages/explore/explore.component';

export const routes: Routes = [
  // Default route: Redirect to Instagram profile
  { path: '', pathMatch: 'full', redirectTo: 'profile/instagram' },
  // Explore routes
  { path: 'explore', component: ExploreComponent },
  { path: 'explore/hashtag/:hashtag/post/:code', component: ExploreComponent },
  // Profile routes
  { path: 'profile/:username', component: ProfileComponent },
  { path: 'profile/:username/post/:code', component: ProfileComponent },
  { path: 'profile/:username/reel/:code', component: ProfileComponent },
  // Wildcard route: Redirect unknown paths to Instagram profile
  { path: '**', redirectTo: 'profile/instagram' },
];
