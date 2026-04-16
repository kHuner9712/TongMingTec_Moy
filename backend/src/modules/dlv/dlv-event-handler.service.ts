import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../common/events/event-bus.service';
import { DomainEvent } from '../../common/events/domain-event';
import { OrdService } from '../ord/ord.service';
import { PayService } from '../pay/pay.service';
import { DlvService } from './dlv.service';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class DlvEventHandler implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly ordService: OrdService,
    private readonly payService: PayService,
    private readonly dlvService: DlvService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe(
      'order.status_changed',
      this.handleOrderStatusChanged.bind(this),
    );
    this.eventBus.subscribe(
      'subscription.opened',
      this.handleSubscriptionOpened.bind(this),
    );
    this.eventBus.subscribe(
      'payment.status_changed',
      this.handlePaymentStatusChanged.bind(this),
    );
    this.eventBus.subscribe(
      'delivery.status_changed',
      this.handleDeliveryStatusChanged.bind(this),
    );
  }

  private async handleOrderStatusChanged(event: DomainEvent): Promise<void> {
    const { orgId, aggregateId: orderId } = event;
    const { toStatus } = event.payload as { fromStatus: string; toStatus: string };

    if (toStatus !== 'active') return;

    try {
      const detail = await this.ordService.findOrderDetail(orderId, orgId);
      const order = detail.order;

      await this.dlvService.ensureDeliveryForActivatedOrder({
        orgId,
        orderId: order.id,
        customerId: order.customerId,
        contractId: order.contractId,
        ownerUserId: order.createdBy || SYSTEM_USER_ID,
      });
    } catch (err) {
      console.error(`[DLV] handle order activated failed for order ${orderId}:`, err);
    }
  }

  private async handleSubscriptionOpened(event: DomainEvent): Promise<void> {
    const { orgId, aggregateId: subscriptionId } = event;
    const { orderId, customerId } = event.payload as {
      orderId: string;
      customerId: string;
      actorType: string;
      actorId: string;
    };

    if (!orderId || !customerId) return;

    try {
      await this.dlvService.bindSubscriptionToOrderDelivery(
        orgId,
        orderId,
        subscriptionId,
        customerId,
        SYSTEM_USER_ID,
      );

      await this.ordService.markSubscriptionOpened(
        orderId,
        orgId,
        event.occurredAt ? new Date(event.occurredAt) : new Date(),
        SYSTEM_USER_ID,
      );
    } catch (err) {
      console.error(
        `[DLV] bind subscription to delivery failed for subscription ${subscriptionId}:`,
        err,
      );
    }
  }

  private async handlePaymentStatusChanged(event: DomainEvent): Promise<void> {
    const { orgId, aggregateId: paymentId } = event;
    const { toStatus } = event.payload as { fromStatus: string; toStatus: string };

    if (toStatus !== 'succeeded') return;

    try {
      const payment = await this.payService.findPaymentById(paymentId, orgId);
      if (!payment.orderId) return;

      await this.dlvService.bindPaymentToOrderDelivery(
        orgId,
        payment.orderId,
        payment.id,
        SYSTEM_USER_ID,
      );
    } catch (err) {
      console.error(`[DLV] bind payment to delivery failed for payment ${paymentId}:`, err);
    }
  }

  private async handleDeliveryStatusChanged(event: DomainEvent): Promise<void> {
    const { orgId, aggregateId: deliveryId } = event;
    const { toStatus } = event.payload as { fromStatus: string; toStatus: string };

    if (toStatus !== 'active') return;

    try {
      const delivery = await this.dlvService.findDeliveryById(deliveryId, orgId);
      if (!delivery.orderId) return;

      await this.ordService.markDeliveryStarted(
        delivery.orderId,
        orgId,
        delivery.startedAt || (event.occurredAt ? new Date(event.occurredAt) : new Date()),
        SYSTEM_USER_ID,
      );
    } catch (err) {
      console.error(
        `[DLV] mark order delivery_started_at failed for delivery ${deliveryId}:`,
        err,
      );
    }
  }
}
