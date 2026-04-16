import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsModule } from '../../common/events/events.module';
import { TskModule } from '../tsk/tsk.module';
import { NtfModule } from '../ntf/ntf.module';
import { OrdModule } from '../ord/ord.module';
import { PayModule } from '../pay/pay.module';
import { DlvController } from './dlv.controller';
import { DlvService } from './dlv.service';
import { DlvEventHandler } from './dlv-event-handler.service';
import { DeliveryOrder } from './entities/delivery-order.entity';
import { DeliveryMilestone } from './entities/delivery-milestone.entity';
import { DeliveryTask } from './entities/delivery-task.entity';
import { DeliveryAcceptance } from './entities/delivery-acceptance.entity';
import { DeliveryRisk } from './entities/delivery-risk.entity';
import { DeliveryOutcome } from './entities/delivery-outcome.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeliveryOrder,
      DeliveryMilestone,
      DeliveryTask,
      DeliveryAcceptance,
      DeliveryRisk,
      DeliveryOutcome,
    ]),
    EventsModule,
    TskModule,
    NtfModule,
    OrdModule,
    PayModule,
  ],
  controllers: [DlvController],
  providers: [DlvService, DlvEventHandler],
  exports: [DlvService],
})
export class DlvModule {}
