import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { randomBytes } from 'crypto';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';
import { fmtDateTime, fmtTime, publicUser } from '../common/util';
import { httpBadge, MESSAGE_COST_BDT } from '../common/config';
import { AuthService } from '../auth/auth.service';

const ATTACH_DISPLAY: Record<string, string> = {
  image: '\u{1F4F7} Photo',
  video: '\u{1F3AC} Video',
  document: '\u{1F4C4} PDF',
};
const ATTACH_LIMIT: Record<string, number> = {
  image: 25 * 1024 * 1024,
  video: 60 * 1024 * 1024,
  document: 20 * 1024 * 1024,
};

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
        last: last.content
          ? last.content
          : ATTACH_DISPLAY[last.attachment_type || ''] || '',
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
        attachment_type: m.attachment_type || null,
        attachment_url: m.attachment_url || null,
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
    const cost = Math.round((target.message_cost || MESSAGE_COST_BDT) * 100) / 100;
    const m = await this.messages.manager.transaction(async (em) => {
      const res = await em
        .createQueryBuilder()
        .update(User)
        .set({
          balance: () => `ROUND("balance" - ${cost}, 2)`,
          total_spent: () => `ROUND("total_spent" + ${cost}, 2)`,
        })
        .where('id = :id AND "balance" >= :cost', { id: user.id, cost })
        .execute();
      if (!res.affected)
        httpBadge(
          HttpStatus.PAYMENT_REQUIRED,
          `Insufficient wallet balance (Tk ${cost} needed to message). Add BDT (Taka) from your Profile -> Wallet.`,
        );
      return em.save(
        em.create(Message, {
          sender_id: user.id,
          receiver_id: userId,
          content,
        }),
      );
    });
    const senderFresh = await this.users.findOne({ where: { id: user.id } });
    return {
      ok: true,
      cost,
      balance: Math.round((senderFresh!.balance || 0) * 100) / 100,
      message: {
        id: m.id,
        me: true,
        content: m.content,
        attachment_type: m.attachment_type || null,
        attachment_url: m.attachment_url || null,
        time: fmtTime(new Date(m.created_at)),
      },
    };
  }

  private saveAttachment(type: string, dataUrl: string): string {
    const match = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(
      dataUrl,
    );
    if (!match) httpBadge(HttpStatus.BAD_REQUEST, 'Invalid file data');
    const mime = match![1];
    const b64 = match![2];
    const limit = ATTACH_LIMIT[type];
    const bytes = Math.floor((b64.length * 3) / 4);
    if (bytes > limit)
      httpBadge(
        HttpStatus.BAD_REQUEST,
        `File too large (max ${Math.round(limit / 1024 / 1024)}MB)`,
      );
    const ext = mime === 'image/png' ? 'png' : mime === 'image/jpeg' || mime === 'image/jpg' ? 'jpg' : mime === 'image/webp' ? 'webp' : mime === 'image/gif' ? 'gif' : mime === 'video/mp4' ? 'mp4' : mime === 'video/webm' ? 'webm' : mime === 'video/quicktime' ? 'mov' : mime === 'application/pdf' ? 'pdf' : '';
    if (!ext) httpBadge(HttpStatus.BAD_REQUEST, 'Unsupported file type');
    const dir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    const name = `${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;
    writeFileSync(join(dir, name), Buffer.from(b64, 'base64'));
    return `/uploads/${name}`;
  }

  async sendAttachment(
    userId: number,
    body: Record<string, unknown>,
    token?: string,
  ) {
    const user = await this.auth.requireUser(token);
    const target = await this.users.findOne({ where: { id: userId } });
    if (!target) httpBadge(HttpStatus.NOT_FOUND, 'User not found');
    if (target.id === user.id)
      httpBadge(HttpStatus.BAD_REQUEST, 'Cannot message yourself');
    const type = (body.attachment_type as string) || '';
    if (!['image', 'video', 'document'].includes(type))
      httpBadge(HttpStatus.BAD_REQUEST, 'Attachment must be image, video or PDF');
    const data = (body.data as string) || '';
    if (!data) httpBadge(HttpStatus.BAD_REQUEST, 'File data required');
    const url = this.saveAttachment(type, data);
    const content = ((body.content as string) || '').trim();
    const cost = Math.round((target.message_cost || MESSAGE_COST_BDT) * 100) / 100;
    const m = await this.messages.manager.transaction(async (em) => {
      const res = await em
        .createQueryBuilder()
        .update(User)
        .set({
          balance: () => `ROUND("balance" - ${cost}, 2)`,
          total_spent: () => `ROUND("total_spent" + ${cost}, 2)`,
        })
        .where('id = :id AND "balance" >= :cost', { id: user.id, cost })
        .execute();
      if (!res.affected)
        httpBadge(
          HttpStatus.PAYMENT_REQUIRED,
          `Insufficient wallet balance (Tk ${cost} needed to message). Add BDT (Taka) from your Profile -> Wallet.`,
        );
      return em.save(
        em.create(Message, {
          sender_id: user.id,
          receiver_id: userId,
          content,
          attachment_type: type,
          attachment_url: url,
        }),
      );
    });
    const senderFresh = await this.users.findOne({ where: { id: user.id } });
    return {
      ok: true,
      cost,
      balance: Math.round((senderFresh!.balance || 0) * 100) / 100,
      message: {
        id: m.id,
        me: true,
        content: m.content,
        attachment_type: m.attachment_type || null,
        attachment_url: m.attachment_url || null,
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