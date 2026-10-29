import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/schemas/user.schemas';
import { Role } from '../users/user-role.enum';

describe('AuthController', () => {
  let controller: AuthController;

  const tokens = { accessToken: 'access', refreshToken: 'refresh' };
  const user = { _id: 'u1', email: 'admin@miniapp.local' };

  const mockAuthService = {
    login: jest.fn(() => Promise.resolve({ user, tokens })),
    refresh: jest.fn(() => Promise.resolve({ user, tokens })),
    logout: jest.fn(() => Promise.resolve()),
  };

  const res = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as Response & {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        // Dependencias del JwtAuthGuard
        { provide: JwtService, useValue: {} },
        { provide: getModelToken(User.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('login guarda los tokens en cookies httpOnly y no los devuelve en el body', async () => {
    const dto: LoginDto = {
      email: 'admin@miniapp.local',
      password: 'admin123',
    };
    const body = await controller.login(dto, res);

    expect(body).toEqual({ ok: true, user });
    expect(JSON.stringify(body)).not.toContain('access');
    expect(res.cookie).toHaveBeenCalledWith(
      'access_token',
      'access',
      expect.objectContaining({ httpOnly: true, sameSite: 'strict' }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      'refresh_token',
      'refresh',
      expect.objectContaining({ httpOnly: true }),
    );
  });

  it('refresh lee el token de la cookie', async () => {
    const req = { cookies: { refresh_token: 'refresh' } } as unknown as Request;
    await controller.refresh(req, res);
    expect(mockAuthService.refresh).toHaveBeenCalledWith('refresh');
  });

  it('logout invalida los tokens y borra las cookies', async () => {
    const current = {
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      role: Role.Admin,
      mustChangePassword: false,
    };
    await controller.logout(current, res);
    expect(mockAuthService.logout).toHaveBeenCalledWith('u1');
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  it('/me devuelve el usuario autenticado', () => {
    const current = {
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      role: Role.Viewer,
      mustChangePassword: false,
    };
    expect(controller.me(current)).toBe(current);
  });
});
