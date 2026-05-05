import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

export type BillItemType = 'plan' | 'add_on' | 'quota' | 'tax' | 'manual';

@Entity('bill_items')
export class BillItem extends BaseEntity {
  @Column({ type: 'uuid', name: 'bill_id' })
  @Index()
  billId: string;

  @Column({ type: 'varchar', length: 128, name: 'item_name' })
  itemName: string;

  @Column({ type: 'varchar', length: 16, name: 'item_type', default: 'manual' })
  @Index()
  itemType: BillItemType;

  @Column({ type: 'numeric', precision: 12, scale: 4, default: 1 })
  quantity: number;

  @Column({ type: 'numeric', precision: 14, scale: 4, name: 'unit_price', default: 0 })
  unitPrice: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  amount: number;

  @Column({ type: 'date', name: 'period_start', nullable: true })
  periodStart: string | null;

  @Column({ type: 'date', name: 'period_end', nullable: true })
  periodEnd: string | null;

  @Column({ type: 'text', nullable: true })
  note: string | null;
}
