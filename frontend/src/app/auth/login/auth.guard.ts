import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from '../../users/users.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login']);
  }

  if (authService.user()?.mustChangePassword) {
    return router.createUrlTree(['/change-password']);
  }

  return true;
};

// Solo requiere sesión (permite el cambio de contraseña pendiente)
export const sessionGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return authService.isLoggedIn() || inject(Router).createUrlTree(['/login']);
};

// Evita mostrar el login a quien ya tiene sesión
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  return !authService.isLoggedIn() || inject(Router).createUrlTree(['/users']);
};

export const roleGuard = (...roles: Role[]): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.hasRole(...roles) || router.createUrlTree(['/users']);
};
