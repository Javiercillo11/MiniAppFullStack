import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe retornar token válido si las credenciales son correctas', () => {
    const res = service.login('admin', 'admin123');
    expect(res.ok).toBe(true);
    expect(res.token).toBe('fake-token');
  });
});
