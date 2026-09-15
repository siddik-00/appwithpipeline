import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { Post } from './entities/post.entity';
import { Like } from './entities/like.entity';
import { Comment } from './entities/comment.entity';
import { Follow } from './entities/follow.entity';
import { Notification } from './entities/notification.entity';
import { Story } from './entities/story.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(Like) private readonly likes: Repository<Like>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(Story) private readonly stories: Repository<Story>,
  ) {}

  async onApplicationBootstrap() {
    try {
      await this.seedDemoData();
    } catch (err) {
      this.logger.error('Seed failed', err);
    }
  }

  private async seedDemoData() {
    const anyUser = await this.users.findOne({ where: {} });
    if (anyUser) return;

    const now = new Date();
    const passHash = bcrypt.hashSync('starconnect', 10);

    const demoUsers = [
      {
        username: 'masud',
        first_name: 'Masud',
        last_name: 'Rahman',
        name: 'Masud Rahman',
        bio: 'Building SiddikConnect Asia',
        email: 'masud@siddikconnect.app',
        phone: '+880 1711-000001',
        profession: 'Founder & CEO',
        address: 'Gulshan, Dhaka',
        country: 'Bangladesh',
        website: 'siddikconnect.app',
        avatar_color: '#6200EE',
        online: true,
        verified: true,
      },
      {
        username: 'nusrat',
        first_name: 'Nusrat',
        last_name: 'Jahan',
        name: 'Nusrat Jahan',
        bio: 'Expert in digital marketing',
        email: 'nusrat@marketing.io',
        phone: '+880 1711-000002',
        profession: 'Digital Marketing Expert',
        address: 'Dhaka',
        country: 'Bangladesh',
        website: 'nusrat.digital',
        avatar_color: '#FF0F7B',
        online: false,
        verified: true,
      },
      {
        username: 'tanvir',
        first_name: 'Tanvir',
        last_name: 'Ahmed',
        name: 'Tanvir Ahmed',
        bio: 'Full-stack developer',
        email: 'tanvir@dev.io',
        phone: '+880 1711-000003',
        profession: 'Full-stack Developer',
        address: 'Sylhet',
        country: 'Bangladesh',
        website: 'tanvir.dev',
        avatar_color: '#006EFF',
        online: false,
        verified: false,
      },
      {
        username: 'sadia',
        first_name: 'Sadia',
        last_name: 'Islam',
        name: 'Sadia Islam',
        bio: 'Career advisor | Mentor',
        email: 'sadia@career.com',
        phone: '+880 1711-000004',
        profession: 'Career Advisor & Mentor',
        address: 'Rajshahi',
        country: 'Bangladesh',
        website: 'sadia.career',
        avatar_color: '#00D68F',
        online: false,
        verified: true,
      },
    ];

    const postsByUsername = new Map<string, string[]>([
      ['masud', [
        'We are hiring! Looking for passionate developers to join our team. 🌟',
        'Thankful to our amazing community for the constant support and feedback! 🙌',
        'Big milestone reached for SiddikConnect. The journey is just beginning!',
      ]],
      ['nusrat', [
        '5 marketing tips that instantly boosted engagement for my clients 📈',
        'Morning routine of top performers: 30 min reading + 10 min planning.',
      ]],
      ['tanvir', [
        "Just shipped a new FastAPI feature. Async + SQLModel is such a smooth combo!",
        "Learned something today: 'Don't fear the refactor. Fear the bug you ignore.'",
      ]],
      ['sadia', [
        'Vernacular languages are the future of online learning in South Asia.',
        "Don't wait for the perfect moment. Start small, build momentum.",
      ]],
    ]);

    const usersMap = new Map<string, User>();
    for (const d of demoUsers) {
      const u = this.users.create({
        ...d,
        password_hash: passHash,
        bio: d.bio,
      });
      const saved = await this.users.save(u);
      usersMap.set(d.username, saved);
    }

    const created = new Date(now.getTime());
    const order: Array<[string, number]> = [
      ['masud', 0],
      ['nusrat', 0],
      ['tanvir', 0],
      ['sadia', 0],
      ['masud', 1],
      ['nusrat', 1],
    ];
    const allPosts: Post[] = [];
    let minute = 5;
    for (const [username, idx] of order) {
      const u = usersMap.get(username)!;
      const content = postsByUsername.get(username)![idx];
      const ts = new Date(created.getTime());
      ts.setHours(10, minute, 0, 0);
      const p = await this.posts.save(
        this.posts.create({ user_id: u.id, content, created_at: ts }),
      );
      allPosts.push(p);
      minute += 5;
    }

    const likeSets: Array<[string, number]> = [
      ['nusrat', allPosts[0].id],
      ['tanvir', allPosts[0].id],
      ['sadia', allPosts[0].id],
      ['masud', allPosts[2].id],
      ['sadia', allPosts[4].id],
    ];
    for (const [uname, pid] of likeSets) {
      await this.likes.save(
        this.likes.create({
          post_id: pid,
          user_id: usersMap.get(uname)!.id,
          reaction: 'like',
          created_at: created,
        }),
      );
    }

    const commentSets: Array<[string, number, string]> = [
      ['nusrat', allPosts[0].id, 'Congrats Masud, this is amazing! 🎉'],
      ['tanvir', allPosts[0].id, "I would love to join. Let's grow together 🚀"],
      ['masud', allPosts[1].id, 'Very useful tips, thank you Nusrat!'],
    ];
    for (const [uname, pid, text] of commentSets) {
      await this.comments.save(
        this.comments.create({
          post_id: pid,
          user_id: usersMap.get(uname)!.id,
          content: text,
          created_at: created,
        }),
      );
    }

    for (const follower of usersMap.values()) {
      for (const target of usersMap.values()) {
        if (follower.id !== target.id) {
          await this.follows.save(
            this.follows.create({
              follower_id: follower.id,
              following_id: target.id,
            }),
          );
        }
      }
    }

    const masud = usersMap.get('masud')!;
    await this.notifications.save(
      this.notifications.create({
        user_id: masud.id,
        actor_id: usersMap.get('nusrat')!.id,
        type: 'like',
        message: 'Nusrat Jahan liked your post',
        created_at: created,
      }),
    );
    await this.notifications.save(
      this.notifications.create({
        user_id: masud.id,
        actor_id: usersMap.get('tanvir')!.id,
        type: 'follow',
        message: 'Tanvir Ahmed started following you',
        created_at: created,
      }),
    );

    const storySpecs: Array<[string, string, string]> = [
      ['masud', 'Big announcement coming! 🔥', 'linear-gradient(135deg,#6200EE,#D397FA)'],
      ['nusrat', 'Daily tip below 👇', 'linear-gradient(135deg,#FF0F7B,#F89B29)'],
      ['tanvir', 'Coding at night 💻', 'linear-gradient(135deg,#006EFF,#00D68F)'],
      ['sadia', 'Career Q&A today!', 'linear-gradient(135deg,#8B5CF6,#EC4899)'],
    ];
    for (const [uname, content, gradient] of storySpecs) {
      await this.stories.save(
        this.stories.create({
          user_id: usersMap.get(uname)!.id,
          content,
          gradient,
          created_at: now,
        }),
      );
    }

    this.logger.log('Demo data seeded');
  }
}