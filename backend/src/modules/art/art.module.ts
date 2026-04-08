import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAgent } from './entities/ai-agent.entity';
import { AiAgentRun } from './entities/ai-agent-run.entity';
import { AiApprovalRequest } from './entities/ai-approval-request.entity';
import { AiRollback } from './entities/ai-rollback.entity';
import { AiTakeover } from './entities/ai-takeover.entity';
import { AiPromptTemplate } from './entities/ai-prompt-template.entity';
import { AiTool } from './entities/ai-tool.entity';
import { AgentRegistryService } from './services/agent-registry.service';
import { ExecutionEngineService } from './services/execution-engine.service';
import { ApprovalEngineService } from './services/approval-engine.service';
import { RollbackEngineService } from './services/rollback-engine.service';
import { TakeoverEngineService } from './services/takeover-engine.service';
import { PromptTemplateService } from './services/prompt-template.service';
import { ToolCallingService } from './services/tool-calling.service';
import { ArtController } from './art.controller';
import { SeedRunner } from './seeds/seed-runner';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AiAgent,
      AiAgentRun,
      AiApprovalRequest,
      AiRollback,
      AiTakeover,
      AiPromptTemplate,
      AiTool,
    ]),
  ],
  controllers: [ArtController],
  providers: [
    AgentRegistryService,
    ExecutionEngineService,
    ApprovalEngineService,
    RollbackEngineService,
    TakeoverEngineService,
    PromptTemplateService,
    ToolCallingService,
    SeedRunner,
  ],
  exports: [
    AgentRegistryService,
    ExecutionEngineService,
    ApprovalEngineService,
    RollbackEngineService,
    TakeoverEngineService,
    PromptTemplateService,
    ToolCallingService,
  ],
})
export class ArtModule {}
