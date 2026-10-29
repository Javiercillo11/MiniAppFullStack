import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User } from './schemas/user.schemas';
import { Role, UserStatus } from './user-role.enum';
import { AuthUser } from '../auth/auth-user.interface';

describe('UsersController', () => {
  let controller: UsersController;

  const actor: AuthUser = {
    id: 'admin',
    email: 'admin@miniapp.local',
    name: 'Admin',
    role: Role.Admin,
  };

  const mockUsersService = {
    findAll: jest.fn(() => [{ _id: '1', name: 'Juan' }]),
    create: jest.fn(),
    update: jest.fn(),
    setStatus: jest.fn(),
    remove: jest.fn(() => ({ ok: true })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: {} },
        { provide: getModelToken(User.name), useValue: {} },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('debe devolver todos los usuarios', () => {
    expect(controller.findAll()).toEqual([{ _id: '1', name: 'Juan' }]);
  });

  it('debe crear un usuario pasando el usuario autenticado', async () => {
    const dto = {
      name: 'Pedro',
      email: 'p@example.com',
      phone: '111222333',
      password: 'secret123',
    };
    await controller.create(dto, actor);
    expect(mockUsersService.create).toHaveBeenCalledWith(dto, actor);
  });

  it('debe actualizar un usuario', async () => {
    const dto = { name: 'Pedro', email: 'p@example.com', phone: '1' };
    await controller.update('1', dto, actor);
    expect(mockUsersService.update).toHaveBeenCalledWith('1', dto, actor);
  });

  it('debe cambiar el estado', async () => {
    await controller.setStatus('1', { status: UserStatus.Inactive }, actor);
    expect(mockUsersService.setStatus).toHaveBeenCalledWith(
      '1',
      UserStatus.Inactive,
      actor,
    );
  });

  it('debe eliminar un usuario', () => {
    expect(controller.remove('1', actor)).toEqual({ ok: true });
    expect(mockUsersService.remove).toHaveBeenCalledWith('1', actor);
  });
});
