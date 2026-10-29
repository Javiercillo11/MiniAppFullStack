import { signal } from '@angular/core';
import { SessionUser } from './auth/login/auth.service';

// Usuario de sesión para los tests
export function sessionUser(overrides: Partial<SessionUser> = {}): SessionUser {
  return {
    id: 'me',
    email: 'admin@miniapp.local',
    name: 'Administrador',
    role: 'admin',
    mustChangePassword: false,
    ...overrides,
  };
}

// Sustituto ligero de AuthService con la misma lógica de roles
export function authServiceStub(user: SessionUser | null = sessionUser()) {
  const current = signal(user);
  const hasRole = (...roles: string[]) => !!current() && roles.includes(current()!.role);
  return {
    user: current.asReadonly(),
    canManage: () => hasRole('admin', 'editor'),
    isAdmin: () => hasRole('admin'),
    hasRole,
    isLoggedIn: () => !!current(),
    set: (u: SessionUser | null) => current.set(u),
  };
}
