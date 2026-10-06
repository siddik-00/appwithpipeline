import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Post } from '../entities/post.entity';
import { publicUser } from '../common/util';
import { httpBadge } from '../common/config';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    private readonly auth: AuthService,
  ) {}

  async updateAvatar(body: Record<string, unknown>, token?: string) {
    const user = await this.auth.requireUser(token);
    const avatarUrl = ((body.avatar_url as string) || '').trim();
    if (!avatarUrl) httpBadge(HttpStatus.BAD_REQUEST, 'Image required');
    if (avatarUrl.length > 20_000_000)
      httpBadge(HttpStatus.BAD_REQUEST, 'Image is too large');
    if (
      !avatarUrl.startsWith('data:image/') &&
      !avatarUrl.startsWith('http://') &&
      !avatarUrl.startsWith('https://')
    )
      httpBadge(HttpStatus.BAD_REQUEST, 'Invalid image');
    user.avatar_url = avatarUrl;
    await this.users.save(user);
    await this.posts.save(
      this.posts.create({
        user_id: user.id,
        content: '🖼️ Updated my profile picture',
        gradient: 'linear-gradient(135deg,#6200EE,#D397FA)',
        image: avatarUrl,
      }),
    );
    return { ok: true, avatar_url: user.avatar_url };
  }

  async updateProfile(body: Record<string, unknown>, token?: string) {
    const user = await this.auth.requireUser(token);
    const str = (key: string) => ((body[key] as string) || '').trim();
    if ('first_name' in body) user.first_name = str('first_name');
    if ('last_name' in body) user.last_name = str('last_name');
    if ('email' in body) user.email = str('email');
    if ('phone' in body) user.phone = str('phone');
    if ('profession' in body) user.profession = str('profession');
    if ('address' in body) user.address = str('address');
    if ('country' in body) user.country = str('country');
    if ('website' in body) user.website = str('website');
    if ('name' in body) user.name = str('name');
    if ('bio' in body) user.bio = str('bio');
    const full = `${user.first_name} ${user.last_name}`.trim();
    if (full) user.name = full;
    else if (!user.name) user.name = user.username;
    const saved = await this.users.save(user);
    return { user: publicUser(saved) };
  }
}