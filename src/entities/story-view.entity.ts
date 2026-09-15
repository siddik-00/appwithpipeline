import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['story_id', 'user_id'])
@Entity('storyview')
export class StoryView {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  story_id: number;

  @Index()
  @Column()
  user_id: number;

  @Column({ type: 'datetime', default: () => "datetime('now')" })
  created_at: Date;
}