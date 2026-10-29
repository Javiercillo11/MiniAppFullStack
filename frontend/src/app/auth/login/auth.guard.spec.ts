import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter } from '@angular/router';
import { ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { authGuard, roleGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { authServiceStub, sessionUser } from '../../testing';

describe('Guards', () => {
  let auth: ReturnType<typeof authServiceStub>;

  const run = (guard: typeof authGuard) =>
    TestBed.runInInjectionContext(() =>
      guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot)
    );
  const path = (result: unknown) =>
    result instanceof UrlTree ? TestBed.inject(Router).serializeUrl(result) : result;

  beforeEach(() => {
    auth = authServiceStub(null);
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: auth }],
    });
  });

  it('authGuard redirige al login sin sesión', () => {
    expect(path(run(authGuard))).toBe('/login');
  });

  it('authGuard redirige al cambio de contraseña si está pendiente', () => {
    auth.set(sessionUser({ mustChangePassword: true }));
    expect(path(run(authGuard))).toBe('/change-password');
  });

  it('authGuard deja pasar con sesión válida', () => {
    auth.set(sessionUser());
    expect(run(authGuard)).toBeTrue();
  });

  it('roleGuard bloquea a un lector', () => {
    auth.set(sessionUser({ role: 'viewer' }));
    expect(path(run(roleGuard('admin', 'editor')))).toBe('/users');
  });
});
