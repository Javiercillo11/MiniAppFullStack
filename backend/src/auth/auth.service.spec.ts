import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from '../users/schemas/user.schemas';
import { Role, UserStatus } from '../users/user-role.enum';

type StoredUser = Record<string, unknown> & {
  password: string;
  tokenVersion: number;
};

describe('AuthService', () => {
  let service: AuthService;
  let storedUser: StoredUser | null;

  const query = () => ({
    select: () => ({ exec: () => Promise.resolve(storedUser) }),
  });

  const userModel = {
    findOne: jest.fn(query),
    findById: jest.fn(query),
    updateOne: jest.fn(),
  };

  const jwtService = {
    signAsync: jest.fn((payload: { email?: string }) =>
      Promise.resolve(payload.email ? 'access-token' : 'refresh-token'),
    ),
    verifyAsync: jest.fn(),
  };

  const buildUser = async (
    status = UserStatus.Active,
  ): Promise<StoredUser> => ({
    _id: 'u1',
    name: 'Admin',
    email: 'admin@miniapp.local',
    role: Role.Admin,
    status,
    tokenVersion: 3,
    mustChangePassword: true,
    password: await bcrypt.hash('admin123', 4),
    save: jest.fn(),
    toJSON() {
      return { _id: 'u1', email: 'admin@miniapp.local' };
    },
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('emite tokens de acceso y refresco con la versión del usuario', async () => {
      storedUser = await buildUser();
      const res = await service.login('Admin@miniapp.local', 'admin123');

      expect(res.tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(userModel.findOne).toHaveBeenCalledWith({
        email: 'admin@miniapp.local',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: 'u1',
          email: 'admin@miniapp.local',
          name: 'Admin',
          role: Role.Admin,
          ver: 3,
        },
        expect.objectContaining({ expiresIn: 900 }),
      );
      expect(storedUser.lastLoginAt).toBeInstanceOf(Date);
    });

    it('rechaza una contraseña incorrecta', async () => {
      storedUser = await buildUser();
      await expect(service.login('admin@miniapp.local', 'x')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza un email inexistente', async () => {
      storedUser = null;
      await expect(service.login('nadie@mail.com', 'admin123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza a un usuario desactivado', async () => {
      storedUser = await buildUser(UserStatus.Inactive);
      await expect(
        service.login('admin@miniapp.local', 'admin123'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('refresh', () => {
    it('renueva los tokens si la versión coincide', async () => {
      storedUser = await buildUser();
      jwtService.verifyAsync.mockResolvedValueOnce({ sub: 'u1', ver: 3 });
      const res = await service.refresh('refresh-token');
      expect(res.tokens.accessToken).toBe('access-token');
    });

    it('rechaza un refresco tras cerrar sesión (versión distinta)', async () => {
      storedUser = await buildUser();
      jwtService.verifyAsync.mockResolvedValueOnce({ sub: 'u1', ver: 2 });
      await expect(service.refresh('refresh-token')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rechaza un token de refresco inválido', async () => {
      jwtService.verifyAsync.mockRejectedValueOnce(new Error('bad'));
      await expect(service.refresh('basura')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  it('logout incrementa la versión de tokens', async () => {
    await service.logout('u1');
    expect(userModel.updateOne).toHaveBeenCalledWith(
      { _id: 'u1' },
      { $inc: { tokenVersion: 1 } },
    );
  });

  describe('changePassword', () => {
    it('cambia la contraseña, quita la obligación y cierra otras sesiones', async () => {
      storedUser = await buildUser();
      await service.changePassword('u1', 'admin123', 'nueva-clave-1');

      expect(await bcrypt.compare('nueva-clave-1', storedUser.password)).toBe(
        true,
      );
      expect(storedUser.mustChangePassword).toBe(false);
      expect(storedUser.tokenVersion).toBe(4);
    });

    it('rechaza si la contraseña actual no es correcta', async () => {
      storedUser = await buildUser();
      await expect(
        service.changePassword('u1', 'mal', 'nueva-clave-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rechaza reutilizar la misma contraseña', async () => {
      storedUser = await buildUser();
      await expect(
        service.changePassword('u1', 'admin123', 'admin123'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
