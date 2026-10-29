import { Test, TestingModule } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';
import { User } from '../src/users/schemas/user.schemas';
import { UsersService } from '../src/users/users.service';

interface UserResponse {
  _id: string;
  name: string;
  role: string;
  status: string;
  mustChangePassword: boolean;
  password?: string;
  tokenVersion?: number;
}

// Requiere MongoDB y una BBDD de pruebas (se vacía al empezar), p. ej.:
// MONGO_URI=mongodb://localhost:27017/miniapp-test npm run test:e2e
describe('Auth + Users (E2E)', () => {
  let app: NestExpressApplication;
  let admin: ReturnType<typeof request.agent>;

  const adminEmail = 'admin@miniapp.local';
  const dto = {
    name: 'Juan',
    email: 'juan@example.com',
    phone: '600111222',
    password: 'secret123',
  };

  beforeAll(async () => {
    if (!/test|e2e/.test(process.env.MONGO_URI ?? '')) {
      throw new Error('MONGO_URI debe apuntar a una BBDD de pruebas');
    }

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    configureApp(app);
    await app.init();

    // BBDD limpia con solo el administrador inicial
    await app.get<Model<User>>(getModelToken(User.name)).deleteMany({});
    await app.get(UsersService).onApplicationBootstrap();

    admin = request.agent(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('sin sesión devuelve 401', () => {
    return request(app.getHttpServer()).get('/users').expect(401);
  });

  it('el login guarda el JWT en cookies httpOnly y no lo expone en el body', async () => {
    const res = await admin
      .post('/auth/login')
      .send({ email: adminEmail, password: 'admin123' })
      .expect(200);

    const cookies = ([] as string[]).concat(res.headers['set-cookie'] ?? []);
    expect(cookies.some((c) => /^access_token=.+HttpOnly/i.test(c))).toBe(true);
    expect(cookies.some((c) => /^refresh_token=.+HttpOnly/i.test(c))).toBe(
      true,
    );
    expect(JSON.stringify(res.body)).not.toMatch(/token/i);
  });

  it('el admin inicial debe cambiar la contraseña antes de usar la API', async () => {
    const res = await admin.get('/users').expect(403);
    expect((res.body as { code: string }).code).toBe(
      'PASSWORD_CHANGE_REQUIRED',
    );

    await admin
      .post('/auth/change-password')
      .send({ currentPassword: 'admin123', newPassword: 'nueva-clave-1' })
      .expect(200);

    await admin.get('/users').expect(200);
  });

  it('crea un usuario sin exponer datos sensibles y con cambio de contraseña pendiente', async () => {
    const res = await admin.post('/users').send(dto).expect(201);
    const user = res.body as UserResponse;

    expect(user.role).toBe('viewer');
    expect(user.status).toBe('active');
    expect(user.mustChangePassword).toBe(true);
    expect(user.password).toBeUndefined();
    expect(user.tokenVersion).toBeUndefined();

    await admin
      .patch(`/users/${user._id}/status`)
      .send({ status: 'inactive' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: dto.email, password: dto.password })
      .expect(403);
  });

  it('el refresco renueva la sesión y el logout la invalida', async () => {
    await admin.post('/auth/refresh').expect(200);
    await admin.post('/auth/logout').expect(200);

    await admin.get('/users').expect(401);
    await admin.post('/auth/refresh').expect(401);
  });

  it('limita los intentos de login por IP', async () => {
    const limit = Number(process.env.LOGIN_RATE_LIMIT ?? 5);
    const statuses: number[] = [];

    for (let i = 0; i <= limit; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: adminEmail, password: 'incorrecta' });
      statuses.push(res.status);
    }

    expect(statuses).toContain(429);
  });
});
