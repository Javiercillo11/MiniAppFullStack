import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './users.service';
import { User } from './schemas/user.schemas';
import { Role, UserStatus } from './user-role.enum';
import { AuthUser } from '../auth/auth-user.interface';

const admin: AuthUser = {
  id: 'a1',
  email: 'a@x.com',
  name: 'A',
  role: Role.Admin,
};
const editor: AuthUser = {
  id: 'e1',
  email: 'e@x.com',
  name: 'E',
  role: Role.Editor,
};

const doc = (data: Record<string, unknown>) => ({
  ...data,
  save: jest.fn(function (this: unknown) {
    return Promise.resolve(this);
  }),
  deleteOne: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let target: ReturnType<typeof doc>;

  const userModel = {
    exists: jest.fn(),
    countDocuments: jest.fn(),
    create: jest.fn((data: Record<string, unknown>) => Promise.resolve(data)),
    findById: jest.fn(() => ({ exec: () => Promise.resolve(target) })),
    updateOne: jest.fn(),
  };

  const newUser = {
    name: 'Pedro',
    email: 'p@x.com',
    phone: '111',
    password: 'secret123',
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    userModel.exists.mockResolvedValue(null);
    userModel.countDocuments.mockResolvedValue(1);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: userModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  describe('create', () => {
    it('guarda la contraseña hasheada y obliga a cambiarla', async () => {
      const created = (await service.create(newUser, admin)) as unknown as {
        password: string;
        mustChangePassword: boolean;
      };
      expect(created.password).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', created.password)).toBe(true);
      expect(created.mustChangePassword).toBe(true);
    });

    it('impide a un editor crear administradores', async () => {
      await expect(
        service.create({ ...newUser, role: Role.Admin }, editor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('devuelve 409 si el email ya existe', async () => {
      userModel.exists.mockResolvedValueOnce({ _id: 'x' });
      await expect(service.create(newUser, admin)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    const base = { name: 'P', email: 'p@x.com', phone: '1' };

    it('impide a un editor modificar a un administrador', async () => {
      target = doc({ _id: 'u2', role: Role.Admin, status: UserStatus.Active });
      await expect(service.update('u2', base, editor)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('impide cambiar el propio rol', async () => {
      target = doc({ _id: 'a1', role: Role.Admin, status: UserStatus.Active });
      await expect(
        service.update('a1', { ...base, role: Role.Viewer }, admin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('al restablecer la contraseña de otro, obliga a cambiarla y cierra sus sesiones', async () => {
      target = doc({ _id: 'u2', role: Role.Viewer, status: UserStatus.Active });
      await service.update('u2', { ...base, password: 'otra-clave-1' }, admin);
      expect(target.mustChangePassword).toBe(true);
      expect(userModel.updateOne).toHaveBeenCalledWith(
        { _id: 'u2' },
        { $inc: { tokenVersion: 1 } },
      );
    });

    it('mantiene la contraseña si no se envía', async () => {
      target = doc({
        _id: 'u2',
        role: Role.Viewer,
        status: UserStatus.Active,
        password: 'hash-original',
      });
      const saved = (await service.update('u2', base, admin)) as unknown as {
        password: string;
      };
      expect(saved.password).toBe('hash-original');
    });
  });

  describe('setStatus', () => {
    it('impide desactivarse a uno mismo', async () => {
      target = doc({ _id: 'a1', role: Role.Admin, status: UserStatus.Active });
      await expect(
        service.setStatus('a1', UserStatus.Inactive, admin),
      ).rejects.toThrow(ForbiddenException);
    });

    it('impide desactivar al último administrador activo', async () => {
      target = doc({ _id: 'a2', role: Role.Admin, status: UserStatus.Active });
      userModel.countDocuments.mockResolvedValueOnce(0);
      await expect(
        service.setStatus('a2', UserStatus.Inactive, admin),
      ).rejects.toThrow(BadRequestException);
    });

    it('desactiva a un usuario', async () => {
      target = doc({ _id: 'u2', role: Role.Viewer, status: UserStatus.Active });
      await service.setStatus('u2', UserStatus.Inactive, admin);
      expect(target.status).toBe(UserStatus.Inactive);
      expect(target.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('impide eliminarse a uno mismo', async () => {
      target = doc({ _id: 'a1', role: Role.Admin, status: UserStatus.Active });
      await expect(service.remove('a1', admin)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
