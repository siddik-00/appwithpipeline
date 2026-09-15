import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { SocialService } from './social.service';
import { Request } from 'express';

@Controller()
export class SocialController {
  constructor(private readonly social: SocialService) {}

  private token(req: Request): string | undefined {
    return req.cookies?.['session_token'] as string | undefined;
  }

  @Get('/api/users')
  listUsers(@Req() req: Request) {
    return this.social.listUsers(this.token(req));
  }

  @Post('/api/users/:id/follow')
  toggleFollow(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.social.toggleFollow(id, this.token(req));
  }

  @Post('/api/users/:id/friend')
  requestFriend(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.social.requestFriend(id, this.token(req));
  }

  @Get('/api/friends')
  listFriends(@Req() req: Request) {
    return this.social.listFriends(this.token(req));
  }

  @Post('/api/friends/:id/accept')
  acceptRequest(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.social.acceptRequest(id, this.token(req));
  }

  @Post('/api/friends/:id/decline')
  declineRequest(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.social.declineRequest(id, this.token(req));
  }

  @Post('/api/friends/:id/remove')
  removeFriend(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.social.removeFriend(id, this.token(req));
  }

  @Get('/api/connections')
  connections(@Req() req: Request) {
    return this.social.connections(this.token(req));
  }

  @Get('/api/bookmarks')
  listBookmarks(@Req() req: Request) {
    return this.social.listBookmarks(this.token(req));
  }

  @Get('/api/users/:id/posts')
  userPosts(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.social.userPosts(id, this.token(req));
  }
}