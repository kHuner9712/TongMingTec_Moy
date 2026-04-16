import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { AutoService } from './auto.service';
import { FlowService } from './flow.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CreateAutomationTriggerDto,
  UpdateAutomationTriggerDto,
  AutomationTriggerListQueryDto,
} from './dto/automation-trigger.dto';
import {
  CreateAutomationFlowDto,
  UpdateAutomationFlowDto,
  AutomationFlowListQueryDto,
} from './dto/automation-flow.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('AUTO')
@ApiBearerAuth()
@Controller('automation')
export class AutoController {
  constructor(
    private readonly autoService: AutoService,
    private readonly flowService: FlowService,
  ) {}

  @Get('triggers')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '分页查询自动化触发器' })
  async listTriggers(
    @CurrentUser('orgId') orgId: string,
    @Query() query: AutomationTriggerListQueryDto,
  ) {
    const { items, total } = await this.autoService.findTriggers(
      orgId,
      { status: query.status, eventType: query.eventType },
      query.page || 1,
      query.page_size || 20,
    );
    return {
      items,
      meta: {
        page: query.page || 1,
        page_size: query.page_size || 20,
        total,
        total_pages: Math.ceil(total / (query.page_size || 20)),
        has_next: total > (query.page || 1) * (query.page_size || 20),
      },
    };
  }

  @Get('triggers/:id')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '获取自动化触发器详情' })
  async getTrigger(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.autoService.findTriggerById(id, orgId);
  }

  @Post('triggers')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '创建自动化触发器' })
  async createTrigger(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAutomationTriggerDto,
  ) {
    return this.autoService.createTrigger(orgId, dto, userId);
  }

  @Put('triggers/:id')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '更新自动化触发器' })
  async updateTrigger(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAutomationTriggerDto,
  ) {
    return this.autoService.updateTrigger(id, orgId, dto, userId);
  }

  @Delete('triggers/:id')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '删除自动化触发器' })
  async deleteTrigger(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.autoService.deleteTrigger(id, orgId, userId);
  }

  @Get('flows')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '分页查询自动化流程' })
  async listFlows(
    @CurrentUser('orgId') orgId: string,
    @Query() query: AutomationFlowListQueryDto,
  ) {
    const { items, total } = await this.flowService.findFlows(
      orgId,
      { status: query.status, triggerType: query.triggerType },
      query.page || 1,
      query.page_size || 20,
    );
    return {
      items,
      meta: {
        page: query.page || 1,
        page_size: query.page_size || 20,
        total,
        total_pages: Math.ceil(total / (query.page_size || 20)),
        has_next: total > (query.page || 1) * (query.page_size || 20),
      },
    };
  }

  @Get('flows/:id')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '获取自动化流程详情' })
  async getFlow(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.flowService.findFlowById(id, orgId);
  }

  @Post('flows')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '创建自动化流程' })
  async createFlow(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAutomationFlowDto,
  ) {
    return this.flowService.createFlow(orgId, dto, userId);
  }

  @Put('flows/:id')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '更新自动化流程' })
  async updateFlow(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateAutomationFlowDto,
  ) {
    return this.flowService.updateFlow(id, orgId, dto, userId);
  }

  @Delete('flows/:id')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '删除自动化流程' })
  async deleteFlow(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.flowService.deleteFlow(id, orgId, userId);
  }

  @Post('flows/:id/execute')
  @Permissions('PERM-AUTO-EXECUTE')
  @ApiOperation({ summary: '手动执行自动化流程' })
  async executeFlow(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { payload?: Record<string, unknown> },
  ) {
    return this.flowService.executeFlow(id, orgId, body.payload || {}, userId);
  }

  @Get('flows/:id/runs')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '查询流程执行记录' })
  async listFlowRuns(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @Query('page') page: number,
    @Query('page_size') pageSize: number,
  ) {
    const result = await this.flowService.findRuns(orgId, id, page || 1, pageSize || 20);
    return { items: result.items, total: result.total };
  }

  @Get('runs/:runId/steps')
  @Permissions('PERM-AUTO-MANAGE')
  @ApiOperation({ summary: '查询执行步骤明细' })
  async getRunSteps(
    @Param('runId') runId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.flowService.findRunSteps(orgId, runId);
  }
}
