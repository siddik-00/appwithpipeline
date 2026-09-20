import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['sender_id', 'receiver_id'])
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

  @Column({ default: false })
  read: boolean;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}