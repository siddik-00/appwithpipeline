import { User } from '../entities/user.entity';

export const AVATAR_COLORS = [
  '#6200EE',
  '#006EFF',
  '#00D68F',
  '#F89B29',
  '#FF0F7B',
  '#06b6d4',
  '#8b5cf6',
];

const pad = (n: number) => String(n).padStart(2, '0');

export function fmtDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function fmtMonthYear(d: Date): string {
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' });
}

export function fmtMonthYearAbbr(d: Date): string {
  return d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
}

export function publicUser(u: User | null): Record<string, unknown> | null {
  if (!u) return null;
  return {
    id: u.id,
    username: u.username,
    name: u.name || u.username,
    first_name: u.first_name || '',
    last_name: u.last_name || '',
    profession: u.profession || '',
    website: u.website || '',
    bio: u.bio,
    avatar_color: u.avatar_color,
    avatar_url: u.avatar_url || null,
    verified: u.verified,
    message_cost: Math.round((u.message_cost || 0) * 100) / 100,
  };
}