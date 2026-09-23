import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { FriendRequest } from '../entities/friend-request.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Message, User, FriendRequest])],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}