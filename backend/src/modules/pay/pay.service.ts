import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { PaymentStatus, paymentStateMachine } from '../../common/statemachine/definitions/payment.sm';
import { EventBusService } from '../../common/events/event-bus.service';
import { paymentStatusChanged } from '../../common/events/payment-events';
import { CreatePaymentDto } from './dto/payment.dto';

@Injectable()
export class PayService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private readonly eventBus: EventBusService,
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
    const paymentNo = await this.generatePaymentNo(orgId);

    const payment = this.paymentRepository.create({
      orgId,
      orderId: dto.orderId,
      customerId: dto.customerId,
      paymentNo,
      paymentMethod: dto.paymentMethod || null,
      status: 'pending' as PaymentStatus,
      currency: dto.currency || 'CNY',
      amount: dto.amount,
      externalTxnId: dto.externalTxnId || null,
      remark: dto.remark || null,
      createdBy: userId,
    });

    return this.paymentRepository.save(payment);
  }

  async processPayment(id: string, orgId: string, userId: string): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'processing' as PaymentStatus);

    await this.paymentRepository.update(id, {
      status: 'processing',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'processing',
      actorType: 'user', actorId: userId,
    }));

    return this.findPaymentById(id, orgId);
  }

  async succeedPayment(id: string, orgId: string, externalTxnId: string | undefined, userId: string): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'succeeded' as PaymentStatus);

    await this.paymentRepository.update(id, {
      status: 'succeeded',
      paidAt: new Date(),
      externalTxnId: externalTxnId || payment.externalTxnId,
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'succeeded',
      actorType: 'user', actorId: userId,
    }));

    return this.findPaymentById(id, orgId);
  }

  async failPayment(id: string, orgId: string, userId: string): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'failed' as PaymentStatus);

    await this.paymentRepository.update(id, {
      status: 'failed',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'failed',
      actorType: 'user', actorId: userId,
    }));

    return this.findPaymentById(id, orgId);
  }

  async refundPayment(id: string, orgId: string, userId: string): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'refunded' as PaymentStatus);

    await this.paymentRepository.update(id, {
      status: 'refunded',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'refunded',
      actorType: 'user', actorId: userId,
    }));

    return this.findPaymentById(id, orgId);
  }

  async voidPayment(id: string, orgId: string, userId: string): Promise<Payment> {
    const payment = await this.findPaymentById(id, orgId);
    const fromStatus = payment.status;
    paymentStateMachine.validateTransition(payment.status, 'voided' as PaymentStatus);

    await this.paymentRepository.update(id, {
      status: 'voided',
      updatedBy: userId,
      version: () => 'version + 1',
    });

    this.eventBus.publish(paymentStatusChanged({
      orgId, paymentId: id, fromStatus, toStatus: 'voided',
      actorType: 'user', actorId: userId,
    }));

    return this.findPaymentById(id, orgId);
  }

  async deletePayment(id: string, orgId: string, userId: string): Promise<void> {
    const payment = await this.findPaymentById(id, orgId);
    if (payment.status !== 'pending') throw new ConflictException('STATUS_TRANSITION_INVALID');
    await this.paymentRepository.update(id, { deletedAt: new Date(), updatedBy: userId });
  }

  private async generatePaymentNo(orgId: string): Promise<string> {
    const count = await this.paymentRepository.count({ where: { orgId } });
    const seq = (count + 1).toString().padStart(5, '0');
    const year = new Date().getFullYear();
    return `PAY-${year}-${seq}`;
  }
}
