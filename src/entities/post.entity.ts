import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('post')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  user_id: number;

  @Index()
  @Column({ type: 'int', nullable: true })
  parent_id: number | null;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: 'linear-gradient(135deg,#8364E8,#D397FA)' })
  gradient: string;

  @Column({ type: 'text', nullable: true })
  image: string | null;

  @Column({ type: 'datetime', default: () => "datetime('now')" })
  created_at: Date;
}