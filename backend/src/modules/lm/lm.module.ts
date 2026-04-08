import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadFollowUp } from './entities/lead-follow-up.entity';
import { LmController } from './lm.controller';
import { LmService } from './lm.service';
import { EventsModule } from '../../common/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Lead, LeadFollowUp]),
    EventsModule,
  ],
  controllers: [LmController],
  providers: [LmService],
  exports: [LmService],
})
export class LmModule {}
