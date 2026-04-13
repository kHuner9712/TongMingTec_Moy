import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { SubService } from './sub.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import {
  CreateSubscriptionDto,
  UpdateSubscriptionDto,
  SuspendSubscriptionDto,
  SubscriptionListQueryDto,
} from './dto/subscription.dto';

@Controller('subscriptions')
export class SubController {
  constructor(private readonly subService: SubService) {}

  @Get()
  @Permissions('PERM-SUB-MANAGE')
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
  async getSubscriptionDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.subService.findSubscriptionDetail(id, orgId);
  }

  @Post()
  @Permissions('PERM-SUB-MANAGE')
  async createSubscription(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateSubscriptionDto,
  ) {
    return this.subService.createSubscription(orgId, dto, userId);
  }

  @Put(':id')
  @Permissions('PERM-SUB-MANAGE')
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
  async cancelSubscription(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.subService.cancelSubscription(id, orgId, body.reason || '', userId);
  }

  @Delete(':id')
  @Permissions('PERM-SUB-MANAGE')
  async deleteSubscription(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.subService.deleteSubscription(id, orgId, userId);
  }
}
