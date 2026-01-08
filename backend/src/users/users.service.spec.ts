import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  it('debe crear un usuario', () => {
    const user = service.create({
      name: 'Juan',
      email: 'juan@example.com',
      phone: '1234567890',
    });
    expect(user).toHaveProperty('id');
    expect(user.name).toBe('Juan');
  });

  it('debe listar usuarios', () => {
    const users = service.findAll();
    expect(Array.isArray(users)).toBe(true);
  });
});
