import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { Like } from '../entities/like.entity';
import { Comment } from '../entities/comment.entity';
import { Follow } from '../entities/follow.entity';
import { Notification } from '../entities/notification.entity';
import { Story } from '../entities/story.entity';
import { StoryView } from '../entities/story-view.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { Message } from '../entities/message.entity';
import { CommentReaction } from '../entities/comment-reaction.entity';

const url = (process.env.DATABASE_URL || '').trim();

export default new DataSource({
  type: 'postgres',
  url: url.replace(/^postgres:\/\//, 'postgresql://'),
  entities: [
    User,
    Post,
    Like,
    Comment,
    Follow,
    Notification,
    Story,
    StoryView,
    FriendRequest,
    Bookmark,
    Message,
    CommentReaction,
  ],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
});