import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { Request } from 'express';

@Controller()
export class WalletController {
  constructor(private readonly wallet: WalletService) {}

  private token(req: Request): string | undefined {
    return req.cookies?.['session_token'] as string | undefined;
  }

  @Get('/api/wallet')
  status(@Req() req: Request) {
    return this.wallet.status(this.token(req));
  }

  @Post('/api/wallet/topup')
  topup(@Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.wallet.topup(body, this.token(req));
  }
}