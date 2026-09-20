import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ length: 255 })
  username: string;

  @Column({ length: 512 })
  password_hash: string;

  @Column({ default: '' })
  first_name: string;

  @Column({ default: '' })
  last_name: string;

  @Column({ default: '' })
  email: string;

  @Column({ default: '' })
  phone: string;

  @Column({ default: '' })
  profession: string;

  @Column({ default: '' })
  address: string;

  @Column({ default: '' })
  country: string;

  @Column({ default: '' })
  website: string;

  @Column({ default: '' })
  name: string;

  @Column({ default: '' })
  bio: string;

  @Column({ default: '#6366f1' })
  avatar_color: string;

  @Column({ default: '' })
  avatar_url: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ default: false })
  online: boolean;

  @Column({ type: 'real', default: 2 })
  message_cost: number;

  @Column({ type: 'real', default: 0 })
  balance: number;

  @Column({ type: 'real', default: 0 })
  total_spent: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}