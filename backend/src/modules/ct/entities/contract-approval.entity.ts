import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

@Entity('contract_approvals')
export class ContractApproval extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'contract_id' })
  @Index()
  contractId: string;

  @Column({ type: 'varchar', length: 16, default: 'pending' })
  status: 'pending' | 'approved' | 'rejected';

  @Column({ type: 'uuid', name: 'approver_user_id', nullable: true })
  approverUserId: string | null;

  @Column({ type: 'text', nullable: true })
  comment: string | null;
}
