import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index('IDX_notification_user_read', ['user_id', 'read'])
@Index('IDX_notification_created_at', ['created_at'])
@Entity('notification')
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  user_id: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  actor_id: number | null;

  @Column({ length: 50 })
  type: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  read: boolean;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}