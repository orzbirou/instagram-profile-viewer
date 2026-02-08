import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { ExploreComponent } from './pages/explore/explore.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'explore', component: ExploreComponent },
  { path: 'explore/hashtag/:hashtag/post/:code', component: ExploreComponent },
  { path: 'profile/:username', component: ProfileComponent },
  { path: 'profile/:username/post/:code', component: ProfileComponent },
  { path: 'profile/:username/reel/:code', component: ProfileComponent },
];
