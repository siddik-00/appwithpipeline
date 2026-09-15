import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { fmtDateTime, fmtTime, publicUser } from '../common/util';
import { httpBadge } from '../common/config';
import { AuthService } from '../auth/auth.service';

type Thread = {
  other: Record<string, unknown>;
  other_online: boolean;
  last: string;
  last_time: string;
  last_ts: number;
  unread: number;
};

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message) private readonly messages: Repository<Message>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly auth: AuthService,
  ) {}

  async threads(token?: string) {
    const user = await this.auth.requireUser(token);
    const all = await this.messages.find({
      where: [{ sender_id: user.id }, { receiver_id: user.id }],
    });
    const otherIds = new Set<number>();
    for (const m of all) {
      otherIds.add(m.sender_id === user.id ? m.receiver_id : m.sender_id);
    }
    const otherRows = otherIds.size
      ? await this.users.find({ where: { id: In([...otherIds]) } })
      : [];
    const others = new Map(otherRows.map((u) => [u.id, u]));
    const threads: Thread[] = [];
    for (const oid of [...otherIds].sort((a, b) => a - b)) {
      const other = others.get(oid);
      if (!other) continue;
      const mine = all.filter(
        (m) =>
          (m.sender_id === user.id && m.receiver_id === oid) ||
          (m.sender_id === oid && m.receiver_id === user.id),
      );
      mine.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );
      const last = mine[mine.length - 1];
      threads.push({
        other: publicUser(other)!,
        other_online: other.online,
        last: last.content,
        last_time: fmtDateTime(new Date(last.created_at)),
        last_ts: Math.floor(new Date(last.created_at).getTime() / 1000),
        unread: mine.filter((m) => m.sender_id === oid && !m.read).length,
      });
    }
    threads.sort((a, b) => (b.last_ts || 0) - (a.last_ts || 0));
    return { threads };
  }

  async getMessages(userId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const target = await this.users.findOne({ where: { id: userId } });
    if (!target) httpBadge(HttpStatus.NOT_FOUND, 'User not found');
    const rows = await this.messages.find({
      where: [
        { sender_id: user.id, receiver_id: userId },
        { sender_id: userId, receiver_id: user.id },
      ],
      order: { created_at: 'ASC' },
    });
    return {
      other: publicUser(target),
      messages: rows.map((m) => ({
        id: m.id,
        me: m.sender_id === user.id,
        content: m.content,
        time: fmtTime(new Date(m.created_at)),
      })),
    };
  }

  async sendMessage(userId: number, body: Record<string, unknown>, token?: string) {
    const user = await this.auth.requireUser(token);
    const target = await this.users.findOne({ where: { id: userId } });
    if (!target) httpBadge(HttpStatus.NOT_FOUND, 'User not found');
    if (target.id === user.id)
      httpBadge(HttpStatus.BAD_REQUEST, 'Cannot message yourself');
    const content = ((body.content as string) || '').trim();
    if (!content) httpBadge(HttpStatus.BAD_REQUEST, 'Message required');
    if (content.length > 2000) httpBadge(HttpStatus.BAD_REQUEST, 'Message too long');
    const m = await this.messages.save(
      this.messages.create({
        sender_id: user.id,
        receiver_id: userId,
        content,
      }),
    );
    return {
      ok: true,
      message: {
        id: m.id,
        me: true,
        content: m.content,
        time: fmtTime(new Date(m.created_at)),
      },
    };
  }

  async markRead(userId: number, token?: string) {
    const user = await this.auth.requireUser(token);
    const rows = await this.messages.find({
      where: { sender_id: userId, receiver_id: user.id, read: false },
    });
    for (const m of rows) m.read = true;
    if (rows.length) await this.messages.save(rows);
    return { ok: true };
  }
}