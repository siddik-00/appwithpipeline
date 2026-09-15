import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class SqliteTuningService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SqliteTuningService.name);

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap() {
    if (!this.dataSource.isInitialized) return;
    if ((this.dataSource.options as { type?: string }).type !== 'better-sqlite3') {
      return;
    }
    try {
      await this.dataSource.query('PRAGMA journal_mode = WAL');
      await this.dataSource.query('PRAGMA synchronous = NORMAL');
      await this.dataSource.query('PRAGMA busy_timeout = 5000');
      await this.dataSource.query('PRAGMA foreign_keys = ON');
    } catch (err) {
      this.logger.warn(`SQLite tuning skipped: ${(err as Error).message}`);
    }
  }
}