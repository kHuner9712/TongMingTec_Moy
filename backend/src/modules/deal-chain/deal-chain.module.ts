import { Module } from '@nestjs/common';
import { CtModule } from '../ct/ct.module';
import { OmModule } from '../om/om.module';
import { OrdModule } from '../ord/ord.module';
import { PayModule } from '../pay/pay.module';
import { SubModule } from '../sub/sub.module';
import { EventsModule } from '../../common/events/events.module';
import { DealChainEventHandler } from './deal-chain-event-handler.service';

@Module({
  imports: [
    EventsModule,
    CtModule,
    OmModule,
    OrdModule,
    PayModule,
    SubModule,
  ],
  providers: [DealChainEventHandler],
})
export class DealChainModule {}
