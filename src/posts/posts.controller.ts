import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { Request } from 'express';

@Controller()
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  private token(req: Request): string | undefined {
    return req.cookies?.['session_token'] as string | undefined;
  }

  @Post('/api/posts')
  createPost(@Body() body: Record<string, unknown>, @Req() req: Request) {
    return this.posts.createPost(body, this.token(req));
  }

  @Put('/api/posts/:id')
  editPost(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.posts.editPost(id, body, this.token(req));
  }

  @Delete('/api/posts/:id')
  deletePost(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.posts.deletePost(id, this.token(req));
  }

  @Post('/api/posts/:id/like')
  toggleLike(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.posts.toggleLike(id, body, this.token(req));
  }

  @Post('/api/posts/:id/share')
  sharePost(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.posts.sharePost(id, this.token(req));
  }

  @Post('/api/posts/:id/bookmark')
  toggleBookmark(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.posts.toggleBookmark(id, this.token(req));
  }

  @Post('/api/posts/:id/comments')
  addComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.posts.addComment(id, body, this.token(req));
  }

  @Put('/api/comments/:id')
  editComment(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: Record<string, unknown>,
    @Req() req: Request,
  ) {
    return this.posts.editComment(id, body, this.token(req));
  }

  @Delete('/api/comments/:id')
  deleteComment(@Param('id', ParseIntPipe) id: number, @Req() req: Request) {
    return this.posts.deleteComment(id, this.token(req));
  }
}