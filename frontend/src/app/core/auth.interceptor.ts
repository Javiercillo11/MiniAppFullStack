import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/login/auth.service';

// Endpoints de auth que no deben disparar el refresco automático
const AUTH_ENDPOINTS = /\/auth\/(login|refresh|logout)$/;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const snackBar = inject(MatSnackBar);

  // Las cookies httpOnly viajan solas; withCredentials cubre el caso cross-origin
  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status === 0) {
        snackBar.open('No se puede conectar con el servidor', 'Cerrar', {
          duration: 4000,
          panelClass: 'snack-error'
        });
      }

      if (err.status === 403 && err.error?.code === 'PASSWORD_CHANGE_REQUIRED') {
        router.navigate(['/change-password']);
      }

      // Token de acceso caducado: renovar una vez y repetir la petición
      if (err.status === 401 && !AUTH_ENDPOINTS.test(req.url)) {
        const hadSession = authService.isLoggedIn();
        return authService.refresh().pipe(
          switchMap(ok => {
            if (ok) return next(authReq);
            // Sesión perdida (caducada, cerrada o usuario desactivado)
            if (hadSession) router.navigate(['/login']);
            return throwError(() => err);
          })
        );
      }

      return throwError(() => err);
    })
  );
};
