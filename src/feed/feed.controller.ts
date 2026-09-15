import { Controller, Get, Query, Req } from '@nestjs/common';
import { FeedService } from './feed.service';
import { Request } from 'express';

@Controller()
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  private token(req: Request): string | undefined {
    return req.cookies?.['session_token'] as string | undefined;
  }

  @Get('/api/feed')
  getFeed(@Req() req: Request) {
    return this.feed.feed(this.token(req));
  }

  @Get('/api/search')
  search(@Query('q') q = '', @Req() req: Request) {
    return this.feed.search(q, this.token(req));
  }

  @Get('/api/trending')
  trending() {
    return this.feed.trending();
  }
}