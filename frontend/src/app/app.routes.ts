import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { authGuard, guestGuard, roleGuard, sessionGuard } from './auth/login/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./auth/change-password/change-password.component').then(m => m.ChangePasswordComponent),
    canActivate: [sessionGuard],
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'users' },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/users-list/users-list.component').then(m => m.UsersListComponent),
      },
      {
        path: 'users/create',
        loadComponent: () =>
          import('./users/users-form/users-form.component').then(m => m.UsersFormComponent),
        canActivate: [roleGuard('admin', 'editor')],
      },
      {
        path: 'users/edit/:id',
        loadComponent: () =>
          import('./users/users-form/users-form.component').then(m => m.UsersFormComponent),
        canActivate: [roleGuard('admin', 'editor')],
      },
    ],
  },
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent),
  },
];
