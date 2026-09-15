import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.use(cookieParser());
  // Allow large JSON bodies (profile avatars are base64 data URLs up to ~20MB)
  app.useBodyParser('json', { limit: '25mb' });
  const port = Number(process.env.PORT || 8000);
  await app.listen(port);
  Logger.log(`SiddikConnect running on http://0.0.0.0:${port}`, 'Bootstrap');
}

bootstrap();