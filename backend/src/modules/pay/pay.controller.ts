import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { PayService } from './pay.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreatePaymentDto, PaymentListQueryDto } from './dto/payment.dto';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('PAY')
@ApiBearerAuth()
@Controller('payments')
export class PayController {
  constructor(private readonly payService: PayService) {}

  @Get()
  @Permissions('PERM-PAY-MANAGE')
  @ApiOperation({ summary: '分页查询付款记录' })
  async listPayments(
    @CurrentUser('orgId') orgId: string,
    @Query() query: PaymentListQueryDto,
  ) {
    const { items, total } = await this.payService.findPayments(
      orgId,
      { status: query.status, orderId: query.orderId, customerId: query.customerId },
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
  @Permissions('PERM-PAY-MANAGE')
  @ApiOperation({ summary: '获取付款详情' })
  async getPaymentDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.payService.findPaymentById(id, orgId);
  }

  @Post()
  @Permissions('PERM-PAY-MANAGE')
  @ApiOperation({ summary: '创建付款记录' })
  async createPayment(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.payService.createPayment(orgId, dto, userId);
  }

  @Post(':id/process')
  @Permissions('PERM-PAY-CONFIRM')
  @ApiOperation({ summary: '付款进入处理中' })
  async processPayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.payService.processPayment(id, orgId, userId, version ? Number(version) : undefined);
  }

  @Post(':id/succeed')
  @Permissions('PERM-PAY-CONFIRM')
  @ApiOperation({ summary: '提交付款成功确认（进入待审批）' })
  async succeedPayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { externalTxnId?: string; version?: number },
  ) {
    return this.payService.succeedPayment(id, orgId, body.externalTxnId, userId, body.version);
  }

  @Post(':id/fail')
  @Permissions('PERM-PAY-CONFIRM')
  @ApiOperation({ summary: '标记付款失败' })
  async failPayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.payService.failPayment(id, orgId, userId, version ? Number(version) : undefined);
  }

  @Post(':id/refund')
  @Permissions('PERM-PAY-REFUND')
  @ApiOperation({ summary: '执行付款退款' })
  async refundPayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.payService.refundPayment(id, orgId, userId, version ? Number(version) : undefined);
  }

  @Post(':id/void')
  @Permissions('PERM-PAY-MANAGE')
  @ApiOperation({ summary: '作废付款单' })
  async voidPayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.payService.voidPayment(id, orgId, userId, version ? Number(version) : undefined);
  }

  @Delete(':id')
  @Permissions('PERM-PAY-MANAGE')
  @ApiOperation({ summary: '删除付款单（仅 pending）' })
  async deletePayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Query('version') version?: string,
  ) {
    return this.payService.deletePayment(id, orgId, userId, version ? Number(version) : undefined);
  }
}
