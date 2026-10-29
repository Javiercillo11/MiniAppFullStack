import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(UsersService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('obtiene el listado', () => {
    let users: unknown;
    service.getAll().subscribe(res => (users = res));
    http.expectOne({ method: 'GET', url: '/api/users' }).flush([]);
    expect(users).toEqual([]);
  });

  it('cambia el estado con PATCH', () => {
    service.setStatus('42', 'inactive').subscribe();
    const req = http.expectOne({ method: 'PATCH', url: '/api/users/42/status' });
    expect(req.request.body).toEqual({ status: 'inactive' });
    req.flush({});
  });
});
