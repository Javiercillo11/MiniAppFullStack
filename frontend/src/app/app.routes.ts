import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard } from './auth/login/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/users-list/users-list.component').then(m => m.UsersListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'users/create',
    loadComponent: () =>
      import('./users/users-form/users-form.component').then(m => m.UsersFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'users/edit/:id',
    loadComponent: () =>
      import('./users/users-form/users-form.component').then(m => m.UsersFormComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'login' },
];