import { Entity, Column, Index } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';

@Entity('order_items')
export class OrderItem extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'order_id' })
  @Index()
  orderId: string;

  @Column({ type: 'varchar', length: 16, name: 'item_type' })
  itemType: string;

  @Column({ type: 'uuid', nullable: true, name: 'ref_id' })
  refId: string | null;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0, name: 'unit_price' })
  unitPrice: number;
}
