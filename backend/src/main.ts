import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  configureApp(app);

  if (!process.env.JWT_SECRET) {
    new Logger('Bootstrap').warn(
      'JWT_SECRET no definido: usando un secreto de desarrollo',
    );
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
