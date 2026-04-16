import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { OrdService } from './ord.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateOrderDto, OrderListQueryDto } from './dto/order.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('ORD')
@ApiBearerAuth()
@Controller('orders')
export class OrdController {
  constructor(private readonly ordService: OrdService) {}

  @Get()
  @Permissions('PERM-ORD-MANAGE')
  @ApiOperation({ summary: '分页查询订单列表' })
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
  @ApiOperation({ summary: '获取订单详情（含明细项）' })
  async getOrderDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.ordService.findOrderDetail(id, orgId);
  }

  @Post()
  @Permissions('PERM-ORD-MANAGE')
  @ApiOperation({ summary: '创建订单' })
  async createOrder(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordService.createOrder(orgId, dto, userId);
  }

  @Post('from-contract')
  @Permissions('PERM-ORD-MANAGE')
  @ApiOperation({ summary: '基于合同创建订单' })
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
  @ApiOperation({ summary: '提交订单确认（进入待审批）' })
  async confirmOrder(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.ordService.confirmOrder(id, orgId, userId, version ? Number(version) : undefined);
  }

  @Post(':id/activate')
  @Permissions('PERM-ORD-ACTIVATE')
  @ApiOperation({ summary: '激活订单' })
  async activateOrder(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.ordService.activateOrder(id, orgId, userId, version ? Number(version) : undefined);
  }

  @Post(':id/complete')
  @Permissions('PERM-ORD-MANAGE')
  @ApiOperation({ summary: '完成订单' })
  async completeOrder(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.ordService.completeOrder(id, orgId, userId, version ? Number(version) : undefined);
  }

  @Post(':id/cancel')
  @Permissions('PERM-ORD-MANAGE')
  @ApiOperation({ summary: '取消订单' })
  async cancelOrder(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { reason?: string; version?: number },
  ) {
    return this.ordService.cancelOrder(id, orgId, body.reason, userId, body.version);
  }

  @Delete(':id')
  @Permissions('PERM-ORD-MANAGE')
  @ApiOperation({ summary: '删除订单（仅草稿态）' })
  async deleteOrder(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.ordService.deleteOrder(id, orgId, userId, version ? Number(version) : undefined);
  }
}
