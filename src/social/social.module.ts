import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SocialController } from './social.controller';
import { SocialService } from './social.service';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { Post } from '../entities/post.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { Notification } from '../entities/notification.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Follow,
      Post,
      Bookmark,
      Notification,
      FriendRequest,
    ]),
    PostsModule,
  ],
  controllers: [SocialController],
  providers: [SocialService],
})
export class SocialModule {}