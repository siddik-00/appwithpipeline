import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { User } from '../entities/user.entity';
import { PostsService } from '../posts/posts.service';
import { AuthService } from '../auth/auth.service';
import { publicUser } from '../common/util';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly postsService: PostsService,
    private readonly auth: AuthService,
  ) {}

  async feed(token?: string) {
    const user = await this.auth.getCurrentUser(token);
    const rows = await this.posts.find({
      order: { id: 'DESC' },
      take: 100,
    });
    return {
      user: publicUser(user) || null,
      posts: await this.postsService.buildPosts(rows, user),
    };
  }

  async search(q: string, token?: string) {
    q = q.trim().toLowerCase();
    const user = await this.auth.getCurrentUser(token);
    const results: Array<Record<string, unknown>> = [];
    if (q) {
      const users = await this.users.find({
        where: [{ username: ILike(`%${q}%`) }, { name: ILike(`%${q}%`) }],
      });
      const matched = await this.posts.find({
        where: { content: ILike(`%${q}%`) },
        order: { id: 'DESC' },
        take: 50,
      });
      for (const next of users) {
        results.push({ type: 'user', ...publicUser(next)! });
      }
      const built = await this.postsService.buildPosts(matched, user);
      for (const d of built) {
        results.push({ type: 'post', ...d });
      }
    }
    return { results, q };
  }

  async trending() {
    const topics = [
      { tag: '#SiddikConnect', posts: '12.5k posts' },
      { tag: '#FastAPI', posts: '8.2k posts' },
      { tag: '#CareerTips', posts: '5.1k posts' },
      { tag: '#BengaliTech', posts: '3.4k posts' },
      { tag: '#Marketing', posts: '2.9k posts' },
    ];
    return { topics };
  }
}