import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { OrdService } from './ord.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateOrderDto, OrderListQueryDto } from './dto/order.dto';

@Controller('orders')
export class OrdController {
  constructor(private readonly ordService: OrdService) {}

  @Get()
  @Permissions('PERM-ORD-MANAGE')
  async listOrders(
    @CurrentUser('orgId') orgId: string,
    @Query() query: OrderListQueryDto,
  ) {
    const { items, total } = await this.ordService.findOrders(
      orgId,
      { status: query.status, customerId: query.customerId, orderType: query.orderType },
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
  @Permissions('PERM-ORD-MANAGE')
  async getOrderDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.ordService.findOrderDetail(id, orgId);
  }

  @Post()
  @Permissions('PERM-ORD-MANAGE')
  async createOrder(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordService.createOrder(orgId, dto, userId);
  }

  @Post('from-contract')
  @Permissions('PERM-ORD-MANAGE')
  async createFromContract(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { contractId: string; quoteId?: string; customerId: string },
  ) {
    return this.ordService.createOrderFromContract(
      orgId, body.contractId, body.quoteId || null, body.customerId, userId,
    );
  }

  @Post(':id/confirm')
  @Permissions('PERM-ORD-MANAGE')
  async confirmOrder(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordService.confirmOrder(id, orgId, userId);
  }

  @Post(':id/activate')
  @Permissions('PERM-ORD-ACTIVATE')
  async activateOrder(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordService.activateOrder(id, orgId, userId);
  }

  @Post(':id/complete')
  @Permissions('PERM-ORD-MANAGE')
  async completeOrder(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordService.completeOrder(id, orgId, userId);
  }

  @Post(':id/cancel')
  @Permissions('PERM-ORD-MANAGE')
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    return this.ordService.cancelOrder(id, orgId, body.reason, userId);
  }

  @Delete(':id')
  @Permissions('PERM-ORD-MANAGE')
  async deleteOrder(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.ordService.deleteOrder(id, orgId, userId);
  }
}
