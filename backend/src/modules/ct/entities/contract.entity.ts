import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ContractStatus } from '../../../common/statemachine/definitions/contract.sm';

@Entity('contracts')
export class Contract extends BaseEntity {
  @Column({ type: 'uuid', name: 'quote_id', nullable: true })
  @Index()
  quoteId: string | null;

  @Column({ type: 'uuid', name: 'opportunity_id' })
  @Index()
  opportunityId: string;

  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 32, name: 'contract_no' })
  @Index()
  contractNo: string;

  @Column({
    type: 'varchar',
    length: 16,
    default: 'draft',
  })
  @Index()
  status: ContractStatus;

  @Column({ type: 'timestamptz', nullable: true, name: 'signed_at' })
  signedAt: Date | null;

  @Column({ type: 'date', nullable: true, name: 'starts_on' })
  @Index()
  startsOn: Date | null;

  @Column({ type: 'date', nullable: true, name: 'ends_on' })
  @Index()
  endsOn: Date | null;
}
