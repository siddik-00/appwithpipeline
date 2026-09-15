import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['post_id', 'user_id'])
@Entity('comment')
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  post_id: number;

  @Index()
  @Column()
  user_id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'datetime', default: () => "datetime('now')" })
  created_at: Date;
}