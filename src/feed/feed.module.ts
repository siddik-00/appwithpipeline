import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [TypeOrmModule.forFeature([Post, User]), PostsModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}