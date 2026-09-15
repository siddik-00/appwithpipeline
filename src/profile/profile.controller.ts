import { Body, Controller, Post, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Request } from 'express';

@Controller()
export class ProfileController {
  constructor(private readonly profile: ProfileService) {}

  @Post('/api/profile/avatar')
  updateAvatar(
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.profile.updateAvatar(body, req.cookies?.['session_token']);
  }

  @Post('/api/profile')
  updateProfile(
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.profile.updateProfile(body, req.cookies?.['session_token']);
  }
}