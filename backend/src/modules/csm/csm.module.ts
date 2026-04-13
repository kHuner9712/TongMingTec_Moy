import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerHealthScore } from './entities/customer-health-score.entity';
import { SuccessPlan } from './entities/success-plan.entity';
import { CustomerReturnVisit } from './entities/customer-return-visit.entity';
import { CsmController } from './csm.controller';
import { CsmService } from './csm.service';
import { CsmEventHandler } from './csm-event-handler.service';
import { EventsModule } from '../../common/events/events.module';
import { CmemModule } from '../cmem/cmem.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CustomerHealthScore, SuccessPlan, CustomerReturnVisit]),
    EventsModule,
    CmemModule,
  ],
  controllers: [CsmController],
  providers: [CsmService, CsmEventHandler],
  exports: [CsmService],
})
export class CsmModule {}
