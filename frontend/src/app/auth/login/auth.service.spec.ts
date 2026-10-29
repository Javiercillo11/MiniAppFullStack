import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  const apiUser = {
    _id: 'u1',
    email: 'admin@miniapp.local',
    name: 'Admin',
    role: 'admin',
    mustChangePassword: true,
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('login guarda el usuario de la respuesta (sin token)', () => {
    service.login('admin@miniapp.local', 'admin123').subscribe();
    http.expectOne('/api/auth/login').flush({ ok: true, user: apiUser });

    expect(service.user()).toEqual({
      id: 'u1',
      email: 'admin@miniapp.local',
      name: 'Admin',
      role: 'admin',
      mustChangePassword: true,
    });
    expect(service.isAdmin()).toBeTrue();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('restoreSession deja la sesión vacía si no hay cookies válidas', () => {
    service.restoreSession().subscribe();
    http.expectOne('/api/auth/me').flush({}, { status: 401, statusText: 'Unauthorized' });
    expect(service.isLoggedIn()).toBeFalse();
  });

  it('comparte un único refresco entre peticiones simultáneas', () => {
    service.refresh().subscribe();
    service.refresh().subscribe();
    const reqs = http.match('/api/auth/refresh');
    expect(reqs.length).toBe(1);
    reqs[0].flush({ ok: true, user: apiUser });
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('logout limpia la sesión aunque falle la petición', () => {
    service.login('a@b.com', 'x').subscribe();
    http.expectOne('/api/auth/login').flush({ ok: true, user: apiUser });

    service.logout().subscribe();
    http.expectOne('/api/auth/logout').flush({}, { status: 500, statusText: 'Error' });
    expect(service.isLoggedIn()).toBeFalse();
  });
});
