import { HttpClient } from '@angular/common/http';
import { Injectable, computed, signal } from '@angular/core';
import { Observable, catchError, finalize, map, of, shareReplay, tap } from 'rxjs';
import { Role } from '../../users/users.service';

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
}

interface ApiUser {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  role: Role;
  mustChangePassword?: boolean;
}

// La sesión vive en cookies httpOnly que gestiona el backend:
// el frontend nunca ve ni guarda el token, solo los datos del usuario.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = '/api/auth';
  private session = signal<SessionUser | null>(null);
  private refreshing$?: Observable<boolean>;

  readonly user = this.session.asReadonly();
  readonly canManage = computed(() => this.hasRole('admin', 'editor'));
  readonly isAdmin = computed(() => this.hasRole('admin'));

  constructor(private http: HttpClient) {}

  // Recupera la sesión al arrancar la app (si las cookies siguen siendo válidas)
  restoreSession(): Observable<unknown> {
    return this.http.get<ApiUser>(`${this.api}/me`).pipe(
      tap(user => this.setUser(user)),
      catchError(() => of(null))
    );
  }

  login(email: string, password: string) {
    return this.http
      .post<{ user: ApiUser }>(`${this.api}/login`, { email, password })
      .pipe(tap(res => this.setUser(res.user)));
  }

  changePassword(currentPassword: string, newPassword: string) {
    return this.http
      .post<{ user: ApiUser }>(`${this.api}/change-password`, { currentPassword, newPassword })
      .pipe(tap(res => this.setUser(res.user)));
  }

  // Renueva el token de acceso; comparte la petición si hay varias en curso
  refresh(): Observable<boolean> {
    this.refreshing$ ??= this.http.post<{ user: ApiUser }>(`${this.api}/refresh`, {}).pipe(
      tap(res => this.setUser(res.user)),
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
      finalize(() => (this.refreshing$ = undefined)),
      shareReplay(1)
    );
    return this.refreshing$;
  }

  logout() {
    return this.http.post(`${this.api}/logout`, {}).pipe(
      catchError(() => of(null)),
      finalize(() => this.clearSession())
    );
  }

  clearSession() {
    this.session.set(null);
  }

  isLoggedIn() {
    return !!this.session();
  }

  hasRole(...roles: Role[]) {
    const user = this.session();
    return !!user && roles.includes(user.role);
  }

  private setUser(user: ApiUser) {
    this.session.set({
      id: user.id ?? user._id ?? '',
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: !!user.mustChangePassword,
    });
  }
}
