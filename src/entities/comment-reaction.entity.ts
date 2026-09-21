import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['comment_id', 'user_id'])
@Entity('comment_reaction')
export class CommentReaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  comment_id: number;

  @Index()
  @Column()
  user_id: number;

  @Column({ default: 'like' })
  reaction: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}