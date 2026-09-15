import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { FriendRequest } from '../entities/friend-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User, FriendRequest])],
  controllers: [NotificationsController],
  providers: [NotificationsService],
})
export class NotificationsModule {}