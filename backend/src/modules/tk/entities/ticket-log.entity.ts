import { Entity, Column, Index, ManyToOne, JoinColumn } from 'typeorm';
import { AppendOnlyEntity } from '../../../common/entities/base.entity';
import { Ticket } from './ticket.entity';

@Entity('ticket_logs')
export class TicketLog extends AppendOnlyEntity {
  @Column({ type: 'uuid', name: 'ticket_id' })
  @Index()
  ticketId: string;

  @Column({ type: 'varchar', length: 32 })
  @Index()
  action: string;

  @Column({ type: 'varchar', length: 16, nullable: true, name: 'from_status' })
  fromStatus: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true, name: 'to_status' })
  toStatus: string | null;

  @Column({ type: 'uuid', nullable: true, name: 'operator_user_id' })
  @Index()
  operatorUserId: string | null;

  @Column({ type: 'text', nullable: true })
  remark: string | null;

  @ManyToOne(() => Ticket, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Ticket;
}
