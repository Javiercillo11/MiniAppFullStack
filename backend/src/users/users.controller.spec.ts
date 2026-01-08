import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

interface UsersServiceMock {
  findAll: () => User[];
  create: (dto: Omit<User, 'id'>) => User;
  update: (id: number, dto: Omit<User, 'id'>) => User;
  remove: (id: number) => { deleted: boolean };
}

describe('UsersController', () => {
  let controller: UsersController;

  const mockUsersService: UsersServiceMock = {
    findAll: jest.fn(() => [
      { id: 1, name: 'Juan', email: 'juan@example.com', phone: '1234567890' },
    ]),
    create: jest.fn((dto) => ({ id: 1, ...dto })),
    update: jest.fn((id, dto) => ({ id, ...dto })),
    remove: jest.fn((id) => ({ deleted: true, id })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('debe devolver todos los usuarios', () => {
    expect(controller.findAll()).toEqual([
      { id: 1, name: 'Juan', email: 'juan@example.com', phone: '1234567890' },
    ]);
    expect(mockUsersService.findAll).toHaveBeenCalled();
  });

  it('debe crear un usuario', () => {
    const dto = { name: 'Pedro', email: 'p@example.com', phone: '111222333' };
    expect(controller.create(dto)).toEqual({ id: 1, ...dto });
    expect(mockUsersService.create).toHaveBeenCalledWith(dto);
  });

  it('debe actualizar un usuario', () => {
    const dto = {
      name: 'Pedro Editado',
      email: 'p2@example.com',
      phone: '999888777',
    };
    const res = controller.update(1, dto);
    expect(res).toEqual({ id: 1, ...dto });
    expect(mockUsersService.update).toHaveBeenCalledWith(1, dto);
  });

  it('debe eliminar un usuario', () => {
    const res = controller.remove(1);
    expect(res).toEqual({ deleted: true, id: 1 });
    expect(mockUsersService.remove).toHaveBeenCalledWith(1);
  });
});
