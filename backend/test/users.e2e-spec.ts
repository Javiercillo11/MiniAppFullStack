import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request, { SuperTest, Test as SuperTestTest } from 'supertest';
import { AppModule } from '../src/app.module';

interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
}

describe('UsersController (E2E)', () => {
  let app: INestApplication;
  let server: SuperTest<SuperTestTest>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    server = request(app.getHttpServer());
  });

  it('/users (POST) debe crear un usuario', async () => {
    const dto = {
      name: 'Juan',
      email: 'juan@example.com',
      phone: '1234567890',
    };

    const res = await server.post('/users').send(dto);

    expect(res.status).toBe(201);

    // ⚡ Type assertion para ESLint
    const user = res.body as User;

    expect(user).toHaveProperty('id');
    expect(user.name).toBe(dto.name);
    expect(user.email).toBe(dto.email);
    expect(user.phone).toBe(dto.phone);
  });

  afterAll(async () => {
    await app.close();
  });
});
