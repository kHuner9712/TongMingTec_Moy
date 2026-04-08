import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiApprovalRequest } from '../art/entities/ai-approval-request.entity';
import { AiAgentRun } from '../art/entities/ai-agent-run.entity';
import { ApprovalCenterService } from './services/approval-center.service';
import { ApprovalCenterController } from './approval-center.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AiApprovalRequest, AiAgentRun]),
  ],
  controllers: [ApprovalCenterController],
  providers: [ApprovalCenterService],
  exports: [ApprovalCenterService],
})
export class ApprovalCenterModule {}
