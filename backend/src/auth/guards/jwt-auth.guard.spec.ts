import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../../users/schemas/user.schemas';
import { Role, UserStatus } from '../../users/user-role.enum';

describe('JwtAuthGuard', () => {
  let storedUser: Record<string, unknown> | null;
  let allowPending = false;
  let request: Record<string, unknown>;

  const jwtService = {
    verifyAsync: jest.fn(() => Promise.resolve({ sub: 'u1', ver: 1 })),
  } as unknown as JwtService;
  const reflector = {
    getAllAndOverride: () => allowPending,
  } as unknown as Reflector;
  const userModel = {
    findById: () => ({
      select: () => ({ exec: () => Promise.resolve(storedUser) }),
    }),
  } as unknown as Model<User>;

  const guard = new JwtAuthGuard(jwtService, reflector, userModel);
  const context = () =>
    ({
      switchToHttp: () => ({ getRequest: () => request }),
      getHandler: () => null,
      getClass: () => null,
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    allowPending = false;
    request = { cookies: { access_token: 'jwt' }, headers: {} };
    storedUser = {
      _id: 'u1',
      email: 'a@b.com',
      name: 'A',
      role: Role.Editor,
      status: UserStatus.Active,
      tokenVersion: 1,
      mustChangePassword: false,
    };
  });

  it('acepta el token de la cookie y adjunta el usuario', async () => {
    await expect(guard.canActivate(context())).resolves.toBe(true);
    expect(request.user).toEqual(
      expect.objectContaining({ id: 'u1', role: Role.Editor }),
    );
  });

  it('acepta también la cabecera Bearer', async () => {
    request = { headers: { authorization: 'Bearer jwt' } };
    await expect(guard.canActivate(context())).resolves.toBe(true);
  });

  it('rechaza sin token', async () => {
    request = { headers: {} };
    await expect(guard.canActivate(context())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza un token emitido antes de cerrar sesión', async () => {
    storedUser!.tokenVersion = 2;
    await expect(guard.canActivate(context())).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('bloquea si tiene pendiente cambiar la contraseña', async () => {
    storedUser!.mustChangePassword = true;
    await expect(guard.canActivate(context())).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('permite las rutas marcadas aunque tenga el cambio pendiente', async () => {
    storedUser!.mustChangePassword = true;
    allowPending = true;
    await expect(guard.canActivate(context())).resolves.toBe(true);
  });
});
