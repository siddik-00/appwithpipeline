import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['follower_id', 'following_id'])
@Entity('follow')
export class Follow {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  follower_id: number;

  @Index()
  @Column()
  following_id: number;
}