import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiRollback } from '../art/entities/ai-rollback.entity';
import { AiAgentRun } from '../art/entities/ai-agent-run.entity';
import { RollbackCenterService } from './services/rollback-center.service';
import { RollbackCenterController } from './rollback-center.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiRollback, AiAgentRun]),
  ],
  controllers: [RollbackCenterController],
  providers: [RollbackCenterService],
  exports: [RollbackCenterService],
})
export class RollbackCenterModule {}
