import { HttpException, HttpStatus } from '@nestjs/common';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const MESSAGE_COST_BDT = Number(process.env.MESSAGE_COST_BDT || 2);

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
      synchronize: false,
      migrations: ['dist/database/migrations/*.js'],
      migrationsRun: true,
      migrationsTableName: 'migrations',
    };
  }
  return {
    type: 'better-sqlite3',
    database: 'data/app.db',
    autoLoadEntities: true,
    synchronize: true,
  };
}