import { Entity, Column, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

@Entity('contract_documents')
export class ContractDocument extends BaseEntity {
  @Column({ type: 'uuid', name: 'contract_id' })
  @Index()
  contractId: string;

  @Column({ type: 'varchar', length: 255, name: 'file_url' })
  fileUrl: string;

  @Column({ type: 'varchar', length: 32, name: 'doc_type' })
  docType: string;

  @Column({ type: 'varchar', length: 32, nullable: true, name: 'sign_provider' })
  signProvider: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true, name: 'sign_status' })
  signStatus: string | null;
}
