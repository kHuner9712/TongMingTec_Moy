import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lead } from './entities/lead.entity';
import { LeadFollowUp } from './entities/lead-follow-up.entity';
import { LmController } from './lm.controller';
import { LmService } from './lm.service';

@Module({
  imports: [TypeOrmModule.forFeature([Lead, LeadFollowUp])],
  controllers: [LmController],
  providers: [LmService],
  exports: [LmService],
})
export class LmModule {}
