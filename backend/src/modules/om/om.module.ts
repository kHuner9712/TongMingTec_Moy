import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Opportunity } from './entities/opportunity.entity';
import { OpportunityStageHistory } from './entities/opportunity-stage-history.entity';
import { OmController } from './om.controller';
import { OmService } from './om.service';

@Module({
  imports: [TypeOrmModule.forFeature([Opportunity, OpportunityStageHistory])],
  controllers: [OmController],
  providers: [OmService],
  exports: [OmService],
})
export class OmModule {}
