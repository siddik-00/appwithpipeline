import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { httpBadge, MESSAGE_COST_BDT } from '../common/config';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly auth: AuthService,
  ) {}

  async status(token?: string) {
    const user = await this.auth.requireUser(token);
    return {
      balance: round2(user.balance || 0),
      total_spent: round2(user.total_spent || 0),
      cost_per_message: round2(user.message_cost || MESSAGE_COST_BDT),
    };
  }

  async topup(body: Record<string, unknown>, token?: string) {
    const user = await this.auth.requireUser(token);
    const raw = Number(body.amount);
    if (!Number.isFinite(raw) || raw <= 0)
      httpBadge(HttpStatus.BAD_REQUEST, 'Enter a valid amount');
    if (raw > 1_000_000)
      httpBadge(HttpStatus.BAD_REQUEST, 'Amount is too large');
    const amount = round2(raw);
    user.balance = round2((user.balance || 0) + amount);
    await this.users.save(user);
    return {
      ok: true,
      balance: user.balance,
      total_spent: round2(user.total_spent || 0),
      cost_per_message: round2(user.message_cost || MESSAGE_COST_BDT),
    };
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}