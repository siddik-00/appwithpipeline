import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { Post } from '../entities/post.entity';
import { Notification } from '../entities/notification.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import { AVATAR_COLORS, fmtMonthYear, publicUser } from '../common/util';
import { httpBadge, MESSAGE_COST_BDT } from '../common/config';

@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, string>();

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(FriendRequest)
    private readonly friendReqs: Repository<FriendRequest>,
  ) {}

  pickColor(): string {
    return AVATAR_COLORS[this.sessions.size % AVATAR_COLORS.length];
  }

  async getCurrentUser(token?: string): Promise<User | null> {
    if (!token || !this.sessions.has(token)) return null;
    const username = this.sessions.get(token)!;
    return this.users.findOne({ where: { username } });
  }

  async requireUser(token?: string): Promise<User> {
    const user = await this.getCurrentUser(token);
    if (!user) httpBadge(HttpStatus.UNAUTHORIZED, 'Not authenticated');
    return user!;
  }

  async signup(body: Record<string, unknown>) {
    const username = ((body.username as string) || '').trim();
    const password = (body.password as string) || '';
    const first_name = ((body.first_name as string) || '').trim();
    const last_name = ((body.last_name as string) || '').trim();
    const email = ((body.email as string) || '').trim();
    const profession = ((body.profession as string) || '').trim();
    if (!username || !password)
      httpBadge(HttpStatus.BAD_REQUEST, 'Username and password required');
    const exists = await this.users.findOne({ where: { username } });
    if (exists)
      httpBadge(HttpStatus.BAD_REQUEST, 'Username already exists');
    const password_hash = await bcrypt.hash(password, 10);
    const user = this.users.create({
      username,
      password_hash,
      first_name,
      last_name,
      name: `${first_name} ${last_name}`.trim() || username,
      email,
      profession,
      avatar_color: this.pickColor(),
    });
    await this.users.save(user);
    const token = randomUUID();
    this.sessions.set(token, user.username);
    return { token, user: publicUser(user) };
  }

  async login(body: Record<string, unknown>) {
    const username = ((body.username as string) || '').trim();
    const password = (body.password as string) || '';
    const user = await this.users.findOne({ where: { username } });
    const ok = user && (await bcrypt.compare(password, user.password_hash));
    if (!ok) httpBadge(HttpStatus.BAD_REQUEST, 'Invalid credentials');
    user.online = true;
    await this.users.save(user);
    const token = randomUUID();
    this.sessions.set(token, user.username);
    return { token, user: publicUser(user) };
  }

  async logout(token?: string) {
    const username = token ? this.sessions.get(token) : undefined;
    if (token) this.sessions.delete(token);
    if (username) {
      const user = await this.users.findOne({ where: { username } });
      if (user) {
        user.online = false;
        await this.users.save(user);
      }
    }
    return { ok: true };
  }

  async me(user: User) {
    const followers = await this.follows.count({
      where: { following_id: user.id },
    });
    const following = await this.follows.count({
      where: { follower_id: user.id },
    });
    const posts = await this.posts.count({ where: { user_id: user.id } });
    const unread = await this.notifications.count({
      where: { user_id: user.id, read: false },
    });
    const friends = await this.friendReqs.count({
      where: [
        { from_id: user.id, status: 'accepted' },
        { to_id: user.id, status: 'accepted' },
      ],
    });
    return {
      user: publicUser(user),
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      email: user.email || '',
      phone: user.phone || '',
      profession: user.profession || '',
      address: user.address || '',
      country: user.country || '',
      website: user.website || '',
      since: user.created_at ? fmtMonthYear(new Date(user.created_at)) : '',
      avatar_url: user.avatar_url || null,
      followers,
      following,
      posts,
      friends,
      unread,
      wallet: {
        balance: Math.round((user.balance || 0) * 100) / 100,
        total_spent: Math.round((user.total_spent || 0) * 100) / 100,
        cost_per_message:
          Math.round((user.message_cost || MESSAGE_COST_BDT) * 100) / 100,
      },
    };
  }
}