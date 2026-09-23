import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['sender_id', 'receiver_id'])
@Index('IDX_message_receiver_read', ['receiver_id', 'read'])
@Index('IDX_message_created_at', ['created_at'])
@Entity('message')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  sender_id: number;

  @Index()
  @Column()
  receiver_id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', nullable: true })
  attachment_type: string | null;

  @Column({ type: 'text', nullable: true })
  attachment_url: string | null;

  @Column({ default: false })
  read: boolean;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}