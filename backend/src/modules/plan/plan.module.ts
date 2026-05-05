import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddOn } from './entities/add-on.entity';
import { Plan } from './entities/plan.entity';
import { QuotaPolicy } from './entities/quota-policy.entity';
import { PlanController } from './plan.controller';
import { PlanService } from './plan.service';

@Module({
  imports: [TypeOrmModule.forFeature([Plan, AddOn, QuotaPolicy])],
  controllers: [PlanController],
  providers: [PlanService],
  exports: [PlanService],
})
export class PlanModule {}
