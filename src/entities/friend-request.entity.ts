import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Index(['from_id', 'to_id'])
@Index('IDX_friend_request_from_status', ['from_id', 'status'])
@Index('IDX_friend_request_to_status', ['to_id', 'status'])
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

  @Column({ default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}