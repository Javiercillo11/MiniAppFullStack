import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router, provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => backend.verify());

  it('envía las cookies (withCredentials)', () => {
    http.get('/api/users').subscribe();
    const req = backend.expectOne('/api/users');
    expect(req.request.withCredentials).toBeTrue();
    req.flush([]);
  });

  it('ante un 401 renueva la sesión y repite la petición', () => {
    let result: unknown;
    http.get('/api/users').subscribe(res => (result = res));

    backend.expectOne('/api/users').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh').flush({ ok: true, user: { _id: 'u1', email: 'a', name: 'A', role: 'admin' } });
    backend.expectOne('/api/users').flush(['ok']);

    expect(result).toEqual(['ok']);
  });

  it('redirige al cambio de contraseña si el backend lo exige', () => {
    http.get('/api/users').subscribe({ error: () => undefined });
    backend.expectOne('/api/users').flush(
      { code: 'PASSWORD_CHANGE_REQUIRED' },
      { status: 403, statusText: 'Forbidden' }
    );
    expect(router.navigate).toHaveBeenCalledWith(['/change-password']);
  });

  it('no intenta renovar la sesión en el propio login', () => {
    let status = 0;
    http.post('/api/auth/login', {}).subscribe({ error: err => (status = err.status) });
    backend.expectOne('/api/auth/login').flush({}, { status: 401, statusText: 'Unauthorized' });
    backend.expectNone('/api/auth/refresh');
    expect(status).toBe(401);
  });
});
