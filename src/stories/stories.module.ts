import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { Story } from '../entities/story.entity';
import { StoryView } from '../entities/story-view.entity';
import { User } from '../entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Story, StoryView, User])],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}