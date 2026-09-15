import { HttpException, HttpStatus } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export function httpBadge(status: HttpStatus, detail: string): never {
  throw new HttpException({ detail }, status);
}

export function buildDbConfig(): TypeOrmModuleOptions {
  const url = (process.env.DATABASE_URL || '').trim();
  if (url) {
    return {
      type: 'postgres',
      url: url.replace(/^postgres:\/\//, 'postgresql://'),
      autoLoadEntities: true,
      synchronize: true,
    };
  }
  return {
    type: 'better-sqlite3',
    database: 'data/app.db',
    autoLoadEntities: true,
    synchronize: true,
  };
}