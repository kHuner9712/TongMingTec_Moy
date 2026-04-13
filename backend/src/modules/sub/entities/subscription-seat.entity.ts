import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('subscription_seats')
export class SubscriptionSeat extends BaseEntity {
  @Column({ type: 'uuid', name: 'subscription_id' })
  @Index()
  subscriptionId: string;

  @Column({ type: 'varchar', length: 64, name: 'seat_code' })
  @Index()
  seatCode: string;

  @Column({ type: 'int', name: 'seat_count', default: 0 })
  seatCount: number;

  @Column({ type: 'int', name: 'used_count', default: 0 })
  usedCount: number;
}
