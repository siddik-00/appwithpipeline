import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Not, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { Follow } from '../entities/follow.entity';
import { Post } from '../entities/post.entity';
import { Bookmark } from '../entities/bookmark.entity';
import { Notification } from '../entities/notification.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import { fmtMonthYearAbbr, publicUser } from '../common/util';
import { httpBadge } from '../common/config';
import { AuthService } from '../auth/auth.service';
import { PostsService } from '../posts/posts.service';

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Follow) private readonly follows: Repository<Follow>,
    @InjectRepository(Post) private readonly posts: Repository<Post>,
    @InjectRepository(Bookmark)
    private readonly bookmarkRepo: Repository<Bookmark>,
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(FriendRequest)
    private readonly friendReqs: Repository<FriendRequest>,
    private readonly auth: AuthService,
    private readonly postsService: PostsService,
  ) {}

  private async friendPair(meId: number, otherId: number) {
    return this.friendReqs.findOne({
      where: [
        { from_id: meId, to_id: otherId },
        { from_id: otherId, to_id: meId },
      ],
      order: { id: 'DESC' },
    });
  }

  private async friendStatus(meId: number, otherId: number): Promise<string> {
    if (meId === otherId) return 'none';
    const pair = await this.friendPair(meId, otherId);
    if (!pair || pair.status === 'declined') return 'none';
    if (pair.status === 'accepted') return 'friends';
    return pair.from_id === meId ? 'request_sent' : 'request_received';
  }

  private async friendCount(uid: number): Promise<number> {
    return this.friendReqs.count({
      where: [
        { from_id: uid, status: 'accepted' },
        { to_id: uid, status: 'accepted' },
      ],
    });
  }

  async listUsers(token?: string) {
    const user = await this.auth.requireUser(token);
    const rows = await this.users.find({ where: { id: Not(user.id) } });
    const follows = await this.follows.find({
      where: { follower_id: user.id },
    });
    const followingIds = new Set(follows.map((f) => f.following_id));
    const reqs = await this.friendReqs.find({
      where: [{ from_id: user.id }, { to_id: user.id }],
      order: { id: 'DESC' },
    });
    const friendStatusMap = new Map<number, string>();
    for (const r of reqs) {
      const other = r.from_id === user.id ? r.to_id : r.from_id;
      if (friendStatusMap.has(other)) continue;
      let st = 'none';
      if (r.status === 'accepted') st = 'friends';
      else if (r.status === 'pending')
        st = r.from_id === user.id ? 'request_sent' : 'request_received';
      friendStatusMap.set(other, st);
    }
    const countRows = await this.posts
      .createQueryBuilder('p')
      .select('p.user_id', 'user_id')
      .addSelect('COUNT(*)', 'cnt')
      .groupBy('p.user_id')
      .getRawMany();
    const postCounts = new Map<number, number>();
    for (const r of countRows) {
      postCounts.set(Number(r.user_id), Number(r.cnt));
    }
    return {
      users: rows.map((u) => ({
        ...publicUser(u)!,
        following: followingIds.has(u.id),
        friend_status: friendStatusMap.get(u.id) || 'none',
        post_count: postCounts.get(u.id) || 0,
      })),
    };
  }

  async toggleFollow(userId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const target = await this.users.findOne({ where: { id: userId } });
    if (!target) httpBadge(HttpStatus.NOT_FOUND, 'User not found');
    if (target!.id === user.id)
      httpBadge(HttpStatus.BAD_REQUEST, 'Cannot follow yourself');
    const existing = await this.follows.findOne({
      where: { follower_id: user.id, following_id: userId },
    });
    let following = true;
    if (existing) {
      await this.follows.delete(existing.id);
      following = false;
    } else {
      await this.follows.save(
        this.follows.create({
          follower_id: user.id,
          following_id: userId,
        }),
      );
      await this.notifications.save(
        this.notifications.create({
          user_id: userId,
          actor_id: user.id,
          type: 'follow',
          message: `${user.name || user.username} started following you`,
        }),
      );
    }
    return { following };
  }

  async connections(token?: string) {
    const user = await this.auth.requireUser(token);
    const follows = await this.follows.find({
      where: { follower_id: user.id },
    });
    const followingIds = follows.map((f) => f.following_id);
    let people: Array<Record<string, unknown>> = [];
    if (followingIds.length) {
      const rows = await this.users.find({ where: { id: In(followingIds) } });
      const usersById = new Map(rows.map((u) => [u.id, u]));
      people = followingIds
        .filter((id) => usersById.has(id))
        .map((id) => publicUser(usersById.get(id)!)!);
    }
    return { users: people };
  }

  async listBookmarks(token?: string) {
    const user = await this.auth.requireUser(token);
    const marks = await this.bookmarkRepo.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
    });
    const postIds = marks.map((m) => m.post_id);
    let posts: Post[] = [];
    if (postIds.length) {
      const rows = await this.posts.find({ where: { id: In(postIds) } });
      const byId = new Map(rows.map((p) => [p.id, p]));
      posts = postIds.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
    }
    return { posts: await this.postsService.buildPosts(posts, user) };
  }

  async userPosts(userId: number, token?: string) {
    const user = await this.auth.getCurrentUser(token);
    const target = await this.users.findOne({ where: { id: userId } });
    if (!target) httpBadge(HttpStatus.NOT_FOUND, 'User not found');
    const rows = await this.posts.find({
      where: { user_id: userId },
      order: { id: 'DESC' },
    });
    const followers = await this.follows.count({
      where: { following_id: target.id },
    });
    const following = await this.follows.count({
      where: { follower_id: target.id },
    });
    let is_following = false;
    if (user && user.id !== target.id) {
      const f = await this.follows.findOne({
        where: { follower_id: user.id, following_id: target.id },
      });
      is_following = !!f;
    }
    return {
      user: publicUser(target),
      posts: await this.postsService.buildPosts(rows, user),
      followers,
      following,
      is_following,
      friend_status: user ? await this.friendStatus(user.id, target.id) : 'none',
      friends_count: await this.friendCount(target.id),
      since: target.created_at
        ? fmtMonthYearAbbr(new Date(target.created_at))
        : '',
    };
  }

  async requestFriend(otherId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    if (otherId === user.id)
      httpBadge(HttpStatus.BAD_REQUEST, 'Cannot add yourself as a friend');
    const target = await this.users.findOne({ where: { id: otherId } });
    if (!target) httpBadge(HttpStatus.NOT_FOUND, 'User not found');
    const pair = await this.friendPair(user.id, otherId);
    if (pair && pair.status === 'accepted')
      httpBadge(HttpStatus.BAD_REQUEST, 'Already friends');
    if (pair && pair.status === 'pending') {
      if (pair.from_id === user.id)
        httpBadge(HttpStatus.BAD_REQUEST, 'Friend request already sent');
      httpBadge(
        HttpStatus.BAD_REQUEST,
        'This user already sent you a friend request',
      );
    }
    if (pair) {
      pair.from_id = user.id;
      pair.to_id = otherId;
      pair.status = 'pending';
      await this.friendReqs.save(pair);
    } else {
      await this.friendReqs.save(
        this.friendReqs.create({
          from_id: user.id,
          to_id: otherId,
          status: 'pending',
        }),
      );
    }
    await this.notifications.save(
      this.notifications.create({
        user_id: otherId,
        actor_id: user.id,
        type: 'friend_request',
        message: `${user.name || user.username} sent you a friend request`,
      }),
    );
    return { status: 'request_sent' };
  }

  async acceptRequest(otherId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const pair = await this.friendReqs.findOne({
      where: { from_id: otherId, to_id: user.id, status: 'pending' },
    });
    if (!pair)
      httpBadge(HttpStatus.NOT_FOUND, 'No pending friend request from this user');
    pair.status = 'accepted';
    await this.friendReqs.save(pair);
    await this.notifications.save(
      this.notifications.create({
        user_id: otherId,
        actor_id: user.id,
        type: 'friend_accept',
        message: `${user.name || user.username} accepted your friend request`,
      }),
    );
    return { status: 'friends' };
  }

  async declineRequest(otherId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const pair = await this.friendReqs.findOne({
      where: { from_id: otherId, to_id: user.id, status: 'pending' },
    });
    if (!pair)
      httpBadge(HttpStatus.NOT_FOUND, 'No pending friend request from this user');
    pair.status = 'declined';
    await this.friendReqs.save(pair);
    return { status: 'none' };
  }

  async removeFriend(otherId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const pair = await this.friendPair(user.id, otherId);
    if (!pair || pair.status !== 'accepted')
      httpBadge(HttpStatus.NOT_FOUND, 'Not friends');
    await this.friendReqs.delete(pair.id);
    return { status: 'none' };
  }

  async listFriends(token?: string) {
    const user = await this.auth.requireUser(token);
    const rows = await this.friendReqs.find({
      where: [
        { from_id: user.id, status: 'accepted' },
        { to_id: user.id, status: 'accepted' },
      ],
      order: { id: 'DESC' },
    });
    const ids = rows.map((r) =>
      r.from_id === user.id ? r.to_id : r.from_id,
    );
    const users = ids.length
      ? await this.users.find({ where: { id: In(ids) } })
      : [];
    const byId = new Map(users.map((u) => [u.id, u]));
    return {
      users: ids.filter((id) => byId.has(id)).map((id) => publicUser(byId.get(id)!)!),
    };
  }
}