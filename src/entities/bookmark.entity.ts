import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['post_id', 'user_id'])
@Entity('bookmark')
export class Bookmark {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  post_id: number;

  @Index()
  @Column()
  user_id: number;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}