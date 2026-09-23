import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Request } from 'express';

@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('/api/auth/signup')
  async signup(@Body() body: Record<string, unknown>) {
    return this.auth.signup(body);
  }

  @Post('/api/auth/login')
  async login(@Body() body: Record<string, unknown>) {
    return this.auth.login(body);
  }

  @Post('/api/auth/logout')
  async logout(@Req() req: Request) {
    return this.auth.logout(req.cookies?.['session_token']);
  }

  @Post('/api/auth/forgot-password')
  async forgotPassword(@Body() body: Record<string, unknown>) {
    return this.auth.forgotPassword(body);
  }

  @Post('/api/auth/reset-password')
  async resetPassword(@Body() body: Record<string, unknown>) {
    return this.auth.resetPassword(body);
  }

  @Get('/api/me')
  async me(@Req() req: Request): Promise<Record<string, unknown>> {
    const token = req.cookies?.['session_token'] as string | undefined;
    const user = await this.auth.getCurrentUser(token);
    if (!user) return { user: null };
    return this.auth.me(user);
  }
}