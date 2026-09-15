import { Controller, Get, Post, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Request } from 'express';

@Controller()
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get('/api/notifications')
  list(@Req() req: Request) {
    return this.notifications.list(req.cookies?.['session_token']);
  }

  @Post('/api/notifications/read')
  markRead(@Req() req: Request) {
    return this.notifications.markRead(req.cookies?.['session_token']);
  }
}