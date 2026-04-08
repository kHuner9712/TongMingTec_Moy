import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { AgentRegistryService } from './services/agent-registry.service';
import { ExecutionEngineService } from './services/execution-engine.service';
import { ApprovalEngineService } from './services/approval-engine.service';
import { RollbackEngineService } from './services/rollback-engine.service';
import { TakeoverEngineService } from './services/takeover-engine.service';
import { PromptTemplateService } from './services/prompt-template.service';
import { ToolCallingService } from './services/tool-calling.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { RegisterAgentDto } from './dto/register-agent.dto';
import { ExecuteAgentDto } from './dto/execute-agent.dto';
import { RejectRequestDto } from './dto/approval.dto';
import { RollbackDto } from './dto/rollback.dto';
import { TakeoverDto } from './dto/takeover.dto';
import { CreatePromptTemplateDto } from './dto/prompt-template.dto';
import { RegisterToolDto } from './dto/tool.dto';

@Controller('art')
export class ArtController {
  constructor(
    private readonly agentRegistry: AgentRegistryService,
    private readonly executionEngine: ExecutionEngineService,
    private readonly approvalEngine: ApprovalEngineService,
    private readonly rollbackEngine: RollbackEngineService,
    private readonly takeoverEngine: TakeoverEngineService,
    private readonly promptTemplate: PromptTemplateService,
    private readonly toolCalling: ToolCallingService,
  ) {}

  @Post('agents')
  @Permissions('PERM-AI-AGENT_MANAGE')
  async registerAgent(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: RegisterAgentDto,
  ) {
    return this.agentRegistry.register(orgId, dto);
  }

  @Get('agents')
  @Permissions('PERM-AI-EXECUTE')
  async listAgents(
    @CurrentUser('orgId') orgId: string,
    @Query('status') status?: string,
    @Query('agentType') agentType?: string,
  ) {
    return this.agentRegistry.listAgents(orgId, { status, agentType });
  }

  @Patch('agents/:id/status')
  @Permissions('PERM-AI-AGENT_MANAGE')
  async updateAgentStatus(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Body() body: { action: string },
  ) {
    switch (body.action) {
      case 'activate':
        return this.agentRegistry.activate(id, orgId);
      case 'pause':
        return this.agentRegistry.pause(id, orgId);
      case 'archive':
        return this.agentRegistry.archive(id, orgId);
      default:
        throw new Error('INVALID_ACTION');
    }
  }

  @Post('agents/:code/execute')
  @Permissions('PERM-AI-EXECUTE')
  async executeAgent(
    @Param('code') code: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ExecuteAgentDto,
  ) {
    return this.executionEngine.execute(code, dto.input, orgId, userId, dto.customerId);
  }

  @Get('agent-runs')
  @Permissions('PERM-AI-EXECUTE')
  async listAgentRuns(
    @CurrentUser('orgId') orgId: string,
    @Query('agentId') agentId?: string,
    @Query('status') status?: string,
  ) {
    return this.executionEngine.listRuns(orgId, { agentId, status });
  }

  @Get('agent-runs/:id')
  @Permissions('PERM-AI-EXECUTE')
  async getAgentRun(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.executionEngine.getRun(id, orgId);
  }

  @Get('approvals')
  @Permissions('PERM-AI-APPROVE')
  async listApprovals(
    @CurrentUser('orgId') orgId: string,
    @Query('status') status?: string,
  ) {
    if (status === 'pending') return this.approvalEngine.listPending(orgId);
    return this.approvalEngine.listAll(orgId, { status });
  }

  @Post('approvals/:id/approve')
  @Permissions('PERM-AI-APPROVE')
  async approveRequest(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.approvalEngine.approve(id, orgId, userId);
  }

  @Post('approvals/:id/reject')
  @Permissions('PERM-AI-APPROVE')
  async rejectRequest(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RejectRequestDto,
  ) {
    return this.approvalEngine.reject(id, orgId, userId, dto.reason);
  }

  @Post('rollbacks')
  @Permissions('PERM-AI-ROLLBACK')
  async createRollback(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RollbackDto,
  ) {
    return this.rollbackEngine.rollback(dto.agentRunId, orgId, userId);
  }

  @Get('rollbacks')
  @Permissions('PERM-AI-ROLLBACK')
  async listRollbacks(
    @CurrentUser('orgId') orgId: string,
    @Query('agentRunId') agentRunId?: string,
  ) {
    return this.rollbackEngine.getRollbackRecords(orgId, { agentRunId });
  }

  @Post('takeovers')
  @Permissions('PERM-AI-TAKEOVER')
  async createTakeover(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: TakeoverDto,
  ) {
    return this.takeoverEngine.takeover(dto.agentRunId, orgId, userId, dto.reason);
  }

  @Get('takeovers')
  @Permissions('PERM-AI-TAKEOVER')
  async listTakeovers(
    @CurrentUser('orgId') orgId: string,
    @Query('agentRunId') agentRunId?: string,
  ) {
    return this.takeoverEngine.getTakeoverRecords(orgId, { agentRunId });
  }

  @Get('prompt-templates')
  @Permissions('PERM-AI-AGENT_MANAGE')
  async listPromptTemplates(
    @CurrentUser('orgId') orgId: string,
    @Query('agentCode') agentCode?: string,
  ) {
    return this.promptTemplate.listTemplates(orgId, { agentCode });
  }

  @Post('prompt-templates')
  @Permissions('PERM-AI-AGENT_MANAGE')
  async createPromptTemplate(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: CreatePromptTemplateDto,
  ) {
    return this.promptTemplate.create(orgId, dto);
  }

  @Get('tools')
  @Permissions('PERM-AI-AGENT_MANAGE')
  async listTools(@CurrentUser('orgId') orgId: string) {
    return this.toolCalling.listTools(orgId);
  }

  @Post('tools')
  @Permissions('PERM-AI-AGENT_MANAGE')
  async registerTool(
    @CurrentUser('orgId') orgId: string,
    @Body() dto: RegisterToolDto,
  ) {
    return this.toolCalling.registerTool(orgId, dto);
  }
}
