import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Story } from '../entities/story.entity';
import { StoryView } from '../entities/story-view.entity';
import { User } from '../entities/user.entity';
import { fmtTime, publicUser } from '../common/util';
import { httpBadge } from '../common/config';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class StoriesService {
  constructor(
    @InjectRepository(Story) private readonly stories: Repository<Story>,
    @InjectRepository(StoryView)
    private readonly storyViews: Repository<StoryView>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly auth: AuthService,
  ) {}

  async getStories(token?: string) {
    const user = await this.auth.getCurrentUser(token);
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);

    const expiredRows = await this.stories.find();
    const toDelete = expiredRows.filter(
      (s) => new Date(s.created_at).getTime() < cutoff.getTime(),
    );
    if (toDelete.length) {
      const expiredIds = toDelete.map((s) => s.id);
      await this.stories.delete(expiredIds);
      await this.storyViews.delete({ story_id: In(expiredIds) });
    }

    const all = await this.stories.find();
    const stories = all
      .filter((s) => new Date(s.created_at).getTime() >= cutoff.getTime())
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );

    const allViews = await this.storyViews.find();
    const storyIds = allViews.map((v) => v.story_id);
    const viewableStories = storyIds.length
      ? await this.stories.find({ where: { id: In(storyIds) } })
      : [];
    const ownerOf = new Map(viewableStories.map((s) => [s.id, s.user_id]));
    const counts = new Map<number, number>();
    for (const v of allViews) {
      if (ownerOf.get(v.story_id) !== v.user_id) {
        counts.set(v.story_id, (counts.get(v.story_id) || 0) + 1);
      }
    }

    const myViewed = new Set(
      user ? allViews.filter((v) => v.user_id === user.id).map((v) => v.story_id) : [],
    );

    const authorIds = [...new Set(stories.map((s) => s.user_id))];
    const authorRows = authorIds.length
      ? await this.users.find({ where: { id: In(authorIds) } })
      : [];
    const authors = new Map(authorRows.map((u) => [u.id, u]));

    return {
      stories: stories.map((s) => ({
        id: s.id,
        content: s.content,
        gradient: s.gradient,
        time: fmtTime(new Date(s.created_at)),
        ts: Math.floor(new Date(s.created_at).getTime() / 1000),
        viewed: myViewed.has(s.id),
        view_count: counts.get(s.id) || 0,
        mine: !!(user && s.user_id === user.id),
        author: publicUser(authors.get(s.user_id) || null),
      })),
    };
  }

  async createStory(body: Record<string, unknown>, token?: string) {
    const user = await this.auth.requireUser(token);
    const content = ((body.content as string) || '').trim();
    if (!content) httpBadge(HttpStatus.BAD_REQUEST, 'Story content required');
    const gradient =
      (body.gradient as string) || 'linear-gradient(135deg,#6200EE,#D397FA)';
    const story = await this.stories.save(
      this.stories.create({ user_id: user.id, content, gradient }),
    );
    return { ok: true, id: story.id };
  }

  async viewStory(storyId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const story = await this.stories.findOne({ where: { id: storyId } });
    if (!story) httpBadge(HttpStatus.NOT_FOUND, 'Story not found');
    const cutoff = new Date(Date.now() - 5 * 60 * 1000);
    if (!story!.created_at || new Date(story!.created_at).getTime() < cutoff.getTime())
      httpBadge(HttpStatus.NOT_FOUND, 'Story expired');
    const existing = await this.storyViews.findOne({
      where: { story_id: storyId, user_id: user.id },
    });
    if (!existing) {
      await this.storyViews.save(
        this.storyViews.create({ story_id: storyId, user_id: user.id }),
      );
    }
    const allViews = await this.storyViews.find({ where: { story_id: storyId } });
    const count = allViews.filter((v) => v.user_id !== story!.user_id).length;
    return { ok: true, view_count: count, viewed: true };
  }
}