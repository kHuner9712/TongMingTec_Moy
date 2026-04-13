import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('customer_return_visits')
export class CustomerReturnVisit extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'visit_type' })
  visitType: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'timestamptz', name: 'next_visit_at', nullable: true })
  nextVisitAt: Date | null;
}
