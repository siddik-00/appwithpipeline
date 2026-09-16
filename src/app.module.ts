import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { buildDbConfig } from './common/config';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { FeedModule } from './feed/feed.module';
import { StoriesModule } from './stories/stories.module';
import { SocialModule } from './social/social.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MessagesModule } from './messages/messages.module';
import { ProfileModule } from './profile/profile.module';
import { WalletModule } from './wallet/wallet.module';
import { SeedService } from './seed.service';
import { SqliteTuningService } from './common/sqlite-tuning.service';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { Follow } from './entities/follow.entity';
import { Notification } from './entities/notification.entity';
import { Story } from './entities/story.entity';
import { FriendRequest } from './entities/friend-request.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: buildDbConfig,
    }),
    TypeOrmModule.forFeature([User, Post, Like, Comment, Follow, Notification, Story, FriendRequest]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
    }),
    AuthModule,
    PostsModule,
    FeedModule,
    StoriesModule,
    SocialModule,
    NotificationsModule,
    MessagesModule,
    ProfileModule,
    WalletModule,
  ],
  providers: [SeedService, SqliteTuningService],
})
export class AppModule {}