import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tracks', pathMatch: 'full' },
  { 
    path: 'tracks', 
    loadComponent: () => import('./pages').then(m => m.TracksPageComponent),
    title: 'Music Tracks'
  },
  { 
    path: '**', 
    loadComponent: () => import('./pages').then(m => m.NotFoundPageComponent),
    title: 'Page Not Found'
  }
];
