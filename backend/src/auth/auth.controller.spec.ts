import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  // let authService: AuthService;

  // 🔹 Mock seguro del AuthService
  const mockAuthService = {
    login: jest.fn((username: string, password: string) => {
      if (username === 'admin' && password === 'admin123') {
        return { ok: true, token: 'fake-token' };
      }
      return { ok: false, message: 'Invalid credentials' };
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: mockAuthService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('login con credenciales correctas', () => {
    const dto: LoginDto = { username: 'admin', password: 'admin123' };
    const result = controller.login(dto);

    expect(result.ok).toBe(true);
    expect(result.token).toBe('fake-token');
    expect(mockAuthService.login).toHaveBeenCalledWith(
      dto.username,
      dto.password,
    );
  });

  it('login con credenciales incorrectas', () => {
    const dto: LoginDto = { username: 'admin', password: 'wrongpass' };

    // ⚡ envolver la llamada en función
    const callLogin = () => controller.login(dto);

    expect(callLogin).toThrow(UnauthorizedException);
    expect(mockAuthService.login).toHaveBeenCalledWith(
      dto.username,
      dto.password,
    );
  });
});
