import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Customer } from './customer.entity';

@Entity('customer_contacts')
export class CustomerContact extends BaseEntity {
  @Column({ type: 'uuid', name: 'customer_id' })
  @Index()
  customerId: string;

  @Column({ type: 'varchar', length: 64 })
  @Index()
  name: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  title: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  @Index()
  phone: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  @Index()
  email: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  wechat: string | null;

  @Column({ type: 'boolean', default: false, name: 'is_primary' })
  @Index()
  isPrimary: boolean;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;
}
