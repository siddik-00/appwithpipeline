import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('story')
export class Story {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  user_id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'linear-gradient(135deg,#6200EE,#D397FA)' })
  gradient: string;

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}