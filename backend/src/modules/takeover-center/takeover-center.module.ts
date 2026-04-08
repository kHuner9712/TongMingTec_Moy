import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiTakeover } from '../art/entities/ai-takeover.entity';
import { AiAgentRun } from '../art/entities/ai-agent-run.entity';
import { TakeoverCenterService } from './services/takeover-center.service';
import { TakeoverCenterController } from './takeover-center.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiTakeover, AiAgentRun]),
  ],
  controllers: [TakeoverCenterController],
  providers: [TakeoverCenterService],
  exports: [TakeoverCenterService],
})
export class TakeoverCenterModule {}
