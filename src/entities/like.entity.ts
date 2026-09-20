import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['post_id', 'user_id'])
@Entity('like')
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  post_id: number;

  @Index()
  @Column()
  user_id: number;

  @Column({ default: 'like' })
  reaction: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}