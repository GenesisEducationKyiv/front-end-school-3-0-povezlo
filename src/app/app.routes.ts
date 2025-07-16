import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'tracks', pathMatch: 'full' },
  { 
    path: 'tracks', 
    loadComponent: () => import('./pages').then(m => m.TracksPageComponent),
    title: 'Music Tracks'
  },
  { 
    path: 'material3-demo', 
    loadComponent: () => import('./pages/material3-demo-page/material3-demo-page.component').then(m => m.Material3DemoPageComponent),
    title: 'Material 3 Demo'
  },
  { 
    path: '**', 
    loadComponent: () => import('./pages').then(m => m.NotFoundPageComponent),
    title: 'Page Not Found'
  }
];
