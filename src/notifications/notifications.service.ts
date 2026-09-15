import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { User } from '../entities/user.entity';
import { FriendRequest } from '../entities/friend-request.entity';
import { fmtDateTime, publicUser } from '../common/util';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notifications: Repository<Notification>,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(FriendRequest)
    private readonly friendReqs: Repository<FriendRequest>,
    private readonly auth: AuthService,
  ) {}

  async list(token?: string) {
    const user = await this.auth.requireUser(token);
    const rows = await this.notifications.find({
      where: { user_id: user.id },
      order: { created_at: 'DESC' },
    });
    const actorIds = [
      ...new Set(rows.filter((n) => n.actor_id).map((n) => n.actor_id!)),
    ];
    const actorRows = actorIds.length
      ? await this.users.find({ where: { id: In(actorIds) } })
      : [];
    const actors = new Map(actorRows.map((u) => [u.id, u]));
    const pendingReqs = await this.friendReqs.find({
      where: { to_id: user.id, status: 'pending' },
    });
    const pendingFrom = new Set(pendingReqs.map((r) => r.from_id));
    return {
      notifications: rows.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        read: n.read,
        time: fmtDateTime(new Date(n.created_at)),
        pending:
          n.type === 'friend_request' ? pendingFrom.has(n.actor_id!) : undefined,
        actor: n.actor_id ? publicUser(actors.get(n.actor_id) || null) : null,
      })),
    };
  }

  async markRead(token?: string) {
    const user = await this.auth.requireUser(token);
    const rows = await this.notifications.find({
      where: { user_id: user.id, read: false },
    });
    for (const n of rows) n.read = true;
    if (rows.length) await this.notifications.save(rows);
    return { ok: true };
  }
}