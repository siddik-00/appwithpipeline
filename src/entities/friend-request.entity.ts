import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['from_id', 'to_id'])
@Entity('friend_request')
export class FriendRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column()
  from_id: number;

  @Index()
  @Column()
  to_id: number;

  @Column({ length: 20, default: 'pending' })
  status: string;

  @Column({ type: 'datetime', default: () => "datetime('now')" })
  created_at: Date;
}