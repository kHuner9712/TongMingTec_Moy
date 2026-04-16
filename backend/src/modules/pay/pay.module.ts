import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PayController } from './pay.controller';
import { PayService } from './pay.service';
import { PayApprovalEventHandler } from './pay-approval-event-handler';
import { EventsModule } from '../../common/events/events.module';
import { ApprovalCenterModule } from '../approval-center/approval-center.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment]),
    EventsModule,
    forwardRef(() => ApprovalCenterModule),
  ],
  controllers: [PayController],
  providers: [PayService, PayApprovalEventHandler],
  exports: [PayService],
})
export class PayModule {}
