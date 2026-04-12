import { Controller, Get, Post, Delete, Param, Body, Query } from '@nestjs/common';
import { PayService } from './pay.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreatePaymentDto, PaymentListQueryDto } from './dto/payment.dto';

@Controller('payments')
export class PayController {
  constructor(private readonly payService: PayService) {}

  @Get()
  @Permissions('PERM-PAY-MANAGE')
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
  async getPaymentDetail(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
  ) {
    return this.payService.findPaymentById(id, orgId);
  }

  @Post()
  @Permissions('PERM-PAY-MANAGE')
  async createPayment(
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePaymentDto,
  ) {
    return this.payService.createPayment(orgId, dto, userId);
  }

  @Post(':id/process')
  @Permissions('PERM-PAY-CONFIRM')
  async processPayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.payService.processPayment(id, orgId, userId);
  }

  @Post(':id/succeed')
  @Permissions('PERM-PAY-CONFIRM')
  async succeedPayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
    @Body() body: { externalTxnId?: string },
  ) {
    return this.payService.succeedPayment(id, orgId, body.externalTxnId, userId);
  }

  @Post(':id/fail')
  @Permissions('PERM-PAY-CONFIRM')
  async failPayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.payService.failPayment(id, orgId, userId);
  }

  @Post(':id/refund')
  @Permissions('PERM-PAY-REFUND')
  async refundPayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.payService.refundPayment(id, orgId, userId);
  }

  @Post(':id/void')
  @Permissions('PERM-PAY-MANAGE')
  async voidPayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.payService.voidPayment(id, orgId, userId);
  }

  @Delete(':id')
  @Permissions('PERM-PAY-MANAGE')
  async deletePayment(
    @Param('id') id: string,
    @CurrentUser('orgId') orgId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.payService.deletePayment(id, orgId, userId);
  }
}
