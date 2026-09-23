import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['post_id', 'user_id'])
@Index('IDX_comment_created_at', ['created_at'])
@Index('IDX_comment_parent_id', ['parent_id'])
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

  @Column({ type: 'int', nullable: true })
  parent_id: number | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}