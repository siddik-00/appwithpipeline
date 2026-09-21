import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { Request } from 'express';

@Controller()
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  private token(req: Request): string | undefined {
    return req.cookies?.['session_token'] as string | undefined;
  }

  @Get('/api/messages/threads')
  threads(@Req() req: Request) {
    return this.messages.threads(this.token(req));
  }

  @Get('/api/messages/:id')
  getMessages(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.messages.getMessages(id, this.token(req));
  }

  @Post('/api/messages/:id')
  sendMessage(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.messages.sendMessage(id, body, this.token(req));
  }

  @Post('/api/messages/:id/attachment')
  sendAttachment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.messages.sendAttachment(id, body, this.token(req));
  }

  @Post('/api/messages/:id/read')
  markRead(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.messages.markRead(id, this.token(req));
  }
}