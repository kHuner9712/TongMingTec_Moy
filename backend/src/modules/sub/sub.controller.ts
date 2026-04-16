import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SubService } from './sub.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SuspendSubscriptionDto,
  RenewSubscriptionDto,
  CancelSubscriptionDto,
  SubscriptionListQueryDto,
} from './dto/subscription.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('SUB')
@ApiBearerAuth()
@Controller('subscriptions')
export class SubController {
  constructor(private readonly subService: SubService) {}

  @Get()
  @Permissions('PERM-SUB-MANAGE')
  @ApiOperation({ summary: '分页查询订阅' })
  async listSubscriptions(
    @CurrentUser('orgId') orgId: string,
    @Query() query: SubscriptionListQueryDto,
  ) {
    const { items, total } = await this.subService.findSubscriptions(
      orgId,
      { status: query.status, customerId: query.customerId },
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

  @Get(':id')
  @Permissions('PERM-SUB-MANAGE')
  @ApiOperation({ summary: '获取订阅详情（含席位）' })
  async getSubscriptionDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.subService.findSubscriptionDetail(id, orgId);
  }

  @Post()
  @Permissions('PERM-SUB-MANAGE')
  @ApiOperation({ summary: '创建订阅' })
  async createSubscription(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subService.createSubscription(orgId, dto, userId);
  }

  @Put(':id')
  @Permissions('PERM-SUB-MANAGE')
  @ApiOperation({ summary: '更新订阅配置' })
  async updateSubscription(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateSubscriptionDto,
  ) {
    return this.subService.updateSubscription(id, orgId, dto, userId);
  }

  @Post(':id/suspend')
  @Permissions('PERM-SUB-SUSPEND')
  @ApiOperation({ summary: '暂停订阅' })
  async suspendSubscription(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SuspendSubscriptionDto,
  ) {
    return this.subService.suspendSubscription(id, orgId, dto.reason, userId, dto.version);
  }

  @Post(':id/cancel')
  @Permissions('PERM-SUB-MANAGE')
  @ApiOperation({ summary: '取消订阅' })
  async cancelSubscription(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CancelSubscriptionDto,
  ) {
    return this.subService.cancelSubscription(id, orgId, dto.reason || '', userId, dto.version);
  }

  @Post(':id/renew')
  @Permissions('PERM-SUB-MANAGE')
  @ApiOperation({ summary: '续费并延长订阅有效期' })
  async renewSubscription(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RenewSubscriptionDto,
  ) {
    return this.subService.renewSubscription(
      id,
      orgId,
      dto.newEndsAt,
      dto.renewedByOrderId || null,
      dto.version,
      userId,
    );
  }

  @Delete(':id')
  @Permissions('PERM-SUB-MANAGE')
  @ApiOperation({ summary: '删除订阅（trial/cancelled）' })
  async deleteSubscription(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.subService.deleteSubscription(id, orgId, userId, version ? Number(version) : undefined);
  }
}
