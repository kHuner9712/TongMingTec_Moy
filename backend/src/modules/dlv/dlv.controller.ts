import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { DlvService } from './dlv.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  ChangeDeliveryStatusDto,
  CreateAcceptanceDto,
  CreateDeliveryDto,
  CreateDeliveryTaskDto,
  CreateMilestoneDto,
  CreateOutcomeDto,
  CreateRiskDto,
  DeliveryListQueryDto,
  UpdateDeliveryDto,
  UpdateDeliveryTaskDto,
  UpdateMilestoneDto,
  UpdateOutcomeDto,
  UpdateRiskDto,
} from './dto/dlv.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('DLV')
@ApiBearerAuth()
@Controller('deliveries')
export class DlvController {
  constructor(private readonly dlvService: DlvService) {}

  @Get()
  @Permissions('PERM-DLV-VIEW', 'PERM-ORD-MANAGE', 'PERM-SUB-MANAGE')
  @ApiOperation({ summary: '分页查询交付单' })
  async listDeliveries(
    @CurrentUser('orgId') orgId: string,
    @Query() query: DeliveryListQueryDto,
  ) {
    const { items, total } = await this.dlvService.findDeliveries(
      orgId,
      {
        status: query.status,
        customerId: query.customerId,
        orderId: query.orderId,
        subscriptionId: query.subscriptionId,
      },
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

  @Get('by-order/:orderId')
  @Permissions('PERM-DLV-VIEW', 'PERM-ORD-MANAGE')
  @ApiOperation({ summary: '按订单查询交付单' })
  async getByOrder(
    @Param('orderId') orderId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.dlvService.findDeliveryByOrderId(orderId, orgId);
  }

  @Get('by-subscription/:subscriptionId')
  @Permissions('PERM-DLV-VIEW', 'PERM-SUB-MANAGE')
  @ApiOperation({ summary: '按订阅查询交付单' })
  async getBySubscription(
    @Param('subscriptionId') subscriptionId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.dlvService.findDeliveryBySubscriptionId(subscriptionId, orgId);
  }

  @Get('customer/:customerId/summary')
  @Permissions('PERM-DLV-VIEW', 'PERM-CSM-VIEW')
  @ApiOperation({ summary: '按客户查询交付汇总' })
  async getCustomerSummary(
    @Param('customerId') customerId: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.dlvService.getCustomerDeliverySummary(orgId, customerId);
  }

  @Get(':id')
  @Permissions('PERM-DLV-VIEW', 'PERM-ORD-MANAGE', 'PERM-SUB-MANAGE')
  @ApiOperation({ summary: '获取交付单详情（含里程碑/任务/风险/结果/验收）' })
  async getDeliveryDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.dlvService.findDeliveryDetail(id, orgId);
  }

  @Post()
  @Permissions('PERM-DLV-MANAGE', 'PERM-ORD-MANAGE')
  @ApiOperation({ summary: '创建交付单' })
  async createDelivery(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDeliveryDto,
  ) {
    return this.dlvService.createDelivery(orgId, dto, userId, {
      source: 'manual',
    });
  }

  @Put(':id')
  @Permissions('PERM-DLV-MANAGE', 'PERM-ORD-MANAGE')
  @ApiOperation({ summary: '更新交付单' })
  async updateDelivery(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDeliveryDto,
  ) {
    return this.dlvService.updateDelivery(id, orgId, dto, userId);
  }

  @Post(':id/status')
  @Permissions('PERM-DLV-MANAGE', 'PERM-DLV-ACCEPT')
  @ApiOperation({ summary: '变更交付单状态（含状态机校验）' })
  async changeStatus(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: ChangeDeliveryStatusDto,
  ) {
    return this.dlvService.changeStatus(id, orgId, dto, userId);
  }

  @Delete(':id')
  @Permissions('PERM-DLV-MANAGE')
  @ApiOperation({ summary: '删除交付单（仅 draft/active）' })
  @ApiQuery({ name: 'version', required: false, type: Number, example: 1 })
  async deleteDelivery(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.dlvService.deleteDelivery(
      id,
      orgId,
      userId,
      version ? Number(version) : undefined,
    );
  }

  @Post(':id/milestones')
  @Permissions('PERM-DLV-MANAGE')
  @ApiOperation({ summary: '新增交付里程碑' })
  async createMilestone(
    @Param('id') deliveryId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateMilestoneDto,
  ) {
    return this.dlvService.createMilestone(deliveryId, orgId, dto, userId);
  }

  @Put(':id/milestones/:milestoneId')
  @Permissions('PERM-DLV-MANAGE')
  @ApiOperation({ summary: '更新交付里程碑' })
  async updateMilestone(
    @Param('id') deliveryId: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateMilestoneDto,
  ) {
    return this.dlvService.updateMilestone(
      milestoneId,
      deliveryId,
      orgId,
      dto,
      userId,
    );
  }

  @Post(':id/tasks')
  @Permissions('PERM-DLV-MANAGE')
  @ApiOperation({ summary: '新增交付任务' })
  async createDeliveryTask(
    @Param('id') deliveryId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateDeliveryTaskDto,
  ) {
    return this.dlvService.createDeliveryTask(deliveryId, orgId, dto, userId);
  }

  @Put(':id/tasks/:taskId')
  @Permissions('PERM-DLV-MANAGE')
  @ApiOperation({ summary: '更新交付任务' })
  async updateDeliveryTask(
    @Param('id') deliveryId: string,
    @Param('taskId') taskId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateDeliveryTaskDto,
  ) {
    return this.dlvService.updateDeliveryTask(taskId, deliveryId, orgId, dto, userId);
  }

  @Post(':id/acceptances')
  @Permissions('PERM-DLV-ACCEPT', 'PERM-CSM-MANAGE')
  @ApiOperation({ summary: '新增交付验收记录' })
  async createAcceptance(
    @Param('id') deliveryId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAcceptanceDto,
  ) {
    return this.dlvService.createAcceptance(deliveryId, orgId, dto, userId);
  }

  @Post(':id/risks')
  @Permissions('PERM-DLV-MANAGE')
  @ApiOperation({ summary: '新增交付风险' })
  async createRisk(
    @Param('id') deliveryId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateRiskDto,
  ) {
    return this.dlvService.createRisk(deliveryId, orgId, dto, userId);
  }

  @Put(':id/risks/:riskId')
  @Permissions('PERM-DLV-MANAGE')
  @ApiOperation({ summary: '更新交付风险' })
  async updateRisk(
    @Param('id') deliveryId: string,
    @Param('riskId') riskId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateRiskDto,
  ) {
    return this.dlvService.updateRisk(riskId, deliveryId, orgId, dto, userId);
  }

  @Post(':id/outcomes')
  @Permissions('PERM-DLV-MANAGE', 'PERM-CSM-MANAGE')
  @ApiOperation({ summary: '新增交付结果' })
  async createOutcome(
    @Param('id') deliveryId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOutcomeDto,
  ) {
    return this.dlvService.createOutcome(deliveryId, orgId, dto, userId);
  }

  @Put(':id/outcomes/:outcomeId')
  @Permissions('PERM-DLV-MANAGE', 'PERM-CSM-MANAGE')
  @ApiOperation({ summary: '更新交付结果' })
  async updateOutcome(
    @Param('id') deliveryId: string,
    @Param('outcomeId') outcomeId: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateOutcomeDto,
  ) {
    return this.dlvService.updateOutcome(
      outcomeId,
      deliveryId,
      orgId,
      dto,
      userId,
    );
  }
}
