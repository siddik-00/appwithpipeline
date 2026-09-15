import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import { StoriesService } from './stories.service';
import { Request } from 'express';

@Controller()
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  private token(req: Request): string | undefined {
    return req.cookies?.['session_token'] as string | undefined;
  }

  @Get('/api/stories')
  getStories(@Req() req: Request) {
    return this.stories.getStories(this.token(req));
  }

  @Post('/api/stories')
  createStory(@Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.stories.createStory(body, this.token(req));
  }

  @Post('/api/stories/:id/view')
  viewStory(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.stories.viewStory(id, this.token(req));
  }
}