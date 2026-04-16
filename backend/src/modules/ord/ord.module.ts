import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdController } from './ord.controller';
import { OrdService } from './ord.service';
import { OrdApprovalEventHandler } from './ord-approval-event-handler';
import { EventsModule } from '../../common/events/events.module';
import { ApprovalCenterModule } from '../approval-center/approval-center.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem]),
    EventsModule,
    forwardRef(() => ApprovalCenterModule),
  ],
  controllers: [OrdController],
  providers: [OrdService, OrdApprovalEventHandler],
  exports: [OrdService],
})
export class OrdModule {}
