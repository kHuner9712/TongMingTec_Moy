import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentStatus, paymentStateMachine } from '../../common/statemachine/definitions/payment.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { paymentStatusChanged } from '../../common/events/payment-events';
import { ApprovalCenterService } from '../approval-center/services/approval-center.service';
import { CreatePaymentDto } from './dto/payment.dto';
import {
  generateBusinessNo,
  isUniqueConstraintViolation,
} from '../../common/utils/business-no.util';

@Injectable()
export class PayService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private readonly eventBus: EventBusService,
    private readonly approvalCenterService: ApprovalCenterService,
  ) {}

  async findPayments(
    orgId: string,
    filters: { status?: string; orderId?: string; customerId?: string },
    page: number,
    pageSize: number,
  ): Promise<{ items: Payment[]; total: number }> {
    const qb = this.paymentRepository
      .createQueryBuilder('p')
      .where('p.orgId = :orgId', { orgId })
      .andWhere('p.deletedAt IS NULL');

    if (filters.status) qb.andWhere('p.status = :status', { status: filters.status });
    if (filters.orderId) qb.andWhere('p.orderId = :orderId', { orderId: filters.orderId });
    if (filters.customerId) qb.andWhere('p.customerId = :customerId', { customerId: filters.customerId });

    qb.orderBy('p.updatedAt', 'DESC');
    qb.skip((page - 1) * pageSize).take(pageSize);

    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async findPaymentById(id: string, orgId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id, orgId, deletedAt: null as unknown as undefined },
    });
    if (!payment) throw new NotFoundException('RESOURCE_NOT_FOUND');
    return payment;
  }

  async createPayment(orgId: string, dto: CreatePaymentDto, userId: string): Promise<Payment> {
    return this.savePaymentWithUniqueNo(orgId, {
      orderId: dto.orderId,
      customerId: dto.customerId,
      paymentMethod: dto.paymentMethod || null,
      status: 'pending' as PaymentStatus,
      currency: dto.currency || 'CNY',
      amount: dto.amount,
      externalTxnId: dto.externalTxnId || null,
      remark: dto.remark || null,
      createdBy: userId,
    });
  }

  async processPayment(id: string, orgId: string, userId: string, version?: number): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(payment.version, version);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'processing' as PaymentStatus);

    await this.updatePaymentWithVersion(id, orgId, expectedVersion, {
      status: 'processing',
      updatedBy: userId,
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'processing',
      actorType: 'user', actorId: userId,
    }));

    return this.findPaymentById(id, orgId);
  }

  async succeedPayment(
    id: string,
    orgId: string,
    externalTxnId: string | undefined,
    userId: string,
    version?: number,
  ): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(payment.version, version);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'pending_approval' as PaymentStatus);

    await this.updatePaymentWithVersion(id, orgId, expectedVersion, {
      status: 'pending_approval',
      updatedBy: userId,
    });

    await this.approvalCenterService.createBusinessApprovalRequest(orgId, {
      resourceType: 'payment',
      resourceId: id,
      requestedAction: 'succeed',
      beforeSnapshot: { status: fromStatus, amount: payment.amount },
      proposedAfterSnapshot: { status: 'succeeded', amount: payment.amount },
      explanation: `付款 ${payment.paymentNo} 请求确认，金额 ${payment.amount} ${payment.currency}`,
      customerId: payment.customerId,
    });

    return this.findPaymentById(id, orgId);
  }

  async succeedPaymentAfterApproval(
    id: string,
    orgId: string,
    externalTxnId?: string,
    version?: number,
  ): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(payment.version, version);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'succeeded' as PaymentStatus);

    const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
    await this.updatePaymentWithVersion(id, orgId, expectedVersion, {
      status: 'succeeded',
      paidAt: new Date(),
      externalTxnId: externalTxnId || payment.externalTxnId,
      updatedBy: SYSTEM_USER_ID,
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'succeeded',
      actorType: 'system', actorId: 'approval-gateway',
    }));

    return this.findPaymentById(id, orgId);
  }

  async revertPaymentApproval(id: string, orgId: string, version?: number): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(payment.version, version);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'processing' as PaymentStatus);

    const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
    await this.updatePaymentWithVersion(id, orgId, expectedVersion, {
      status: 'processing',
      updatedBy: SYSTEM_USER_ID,
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'processing',
      actorType: 'system', actorId: 'approval-gateway',
      reason: '审批拒绝，回退到处理中',
    }));

    return this.findPaymentById(id, orgId);
  }

  async failPayment(id: string, orgId: string, userId: string, version?: number): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(payment.version, version);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'failed' as PaymentStatus);

    await this.updatePaymentWithVersion(id, orgId, expectedVersion, {
      status: 'failed',
      updatedBy: userId,
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'failed',
      actorType: 'user', actorId: userId,
    }));

    return this.findPaymentById(id, orgId);
  }

  async refundPayment(id: string, orgId: string, userId: string, version?: number): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(payment.version, version);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'refunded' as PaymentStatus);

    await this.updatePaymentWithVersion(id, orgId, expectedVersion, {
      status: 'refunded',
      updatedBy: userId,
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'refunded',
      actorType: 'user', actorId: userId,
    }));

    return this.findPaymentById(id, orgId);
  }

  async voidPayment(id: string, orgId: string, userId: string, version?: number): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(payment.version, version);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'voided' as PaymentStatus);

    await this.updatePaymentWithVersion(id, orgId, expectedVersion, {
      status: 'voided',
      updatedBy: userId,
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'voided',
      actorType: 'user', actorId: userId,
    }));

    return this.findPaymentById(id, orgId);
  }

  async deletePayment(id: string, orgId: string, userId: string, version?: number): Promise<void> {
    const payment = await this.findPaymentById(id, orgId);
    const expectedVersion = this.resolveExpectedVersion(payment.version, version);
    if (payment.status !== 'pending') throw new ConflictException('STATUS_TRANSITION_INVALID');
    await this.updatePaymentWithVersion(id, orgId, expectedVersion, { deletedAt: new Date(), updatedBy: userId });
  }

  private async savePaymentWithUniqueNo(orgId: string, payload: Partial<Payment>): Promise<Payment> {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const paymentNo = generateBusinessNo('PAY', orgId);
      const payment = this.paymentRepository.create({ ...payload, orgId, paymentNo });
      try {
        return await this.paymentRepository.save(payment);
      } catch (error) {
        if (isUniqueConstraintViolation(error, 'uq_payments_org_no')) {
          continue;
        }
        throw error;
      }
    }

    throw new ConflictException('PAYMENT_NO_GENERATION_FAILED');
  }

  private async updatePaymentWithVersion(
    id: string,
    orgId: string,
    expectedVersion: number,
    patch: Partial<Payment>,
  ): Promise<void> {
    const result = await this.paymentRepository.update(
      { id, orgId, version: expectedVersion, deletedAt: IsNull() },
      {
        ...(patch as Record<string, unknown>),
        version: () => 'version + 1',
      } as any,
    );

    if ((result.affected ?? 0) !== 1) {
      throw new ConflictException('CONFLICT_VERSION');
    }
  }

  private resolveExpectedVersion(currentVersion: number, providedVersion?: number): number {
    if (providedVersion === undefined) return currentVersion;
    if (!Number.isInteger(providedVersion) || providedVersion < 1) {
      throw new BadRequestException('PARAM_INVALID');
    }
    if (providedVersion !== currentVersion) throw new ConflictException('CONFLICT_VERSION');
    return providedVersion;
  }
}
