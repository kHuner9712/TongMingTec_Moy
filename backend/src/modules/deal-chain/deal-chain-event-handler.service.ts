import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../common/events/event-bus.service';
import { DomainEvent } from '../../common/events/domain-event';
import { CtService } from '../ct/ct.service';
import { OmService } from '../om/om.service';
import { OrdService } from '../ord/ord.service';
import { PayService } from '../pay/pay.service';
import { SubService } from '../sub/sub.service';
import { OpportunityResult } from '../om/entities/opportunity.entity';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class DealChainEventHandler implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly ctService: CtService,
    private readonly omService: OmService,
    private readonly ordService: OrdService,
    private readonly payService: PayService,
    private readonly subService: SubService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('contract.status_changed', this.handleContractStatusChanged.bind(this));
    this.eventBus.subscribe('order.status_changed', this.handleOrderStatusChanged.bind(this));
    this.eventBus.subscribe('payment.status_changed', this.handlePaymentStatusChanged.bind(this));
  }

  private async handleContractStatusChanged(event: DomainEvent): Promise<void> {
    const { orgId, aggregateId: contractId } = event;
    const { toStatus } = event.payload as { fromStatus: string; toStatus: string };

    if (toStatus !== 'active') return;

    try {
      const detail = await this.ctService.findContractDetail(contractId, orgId);
      const contract = detail.contract;

      if (contract.opportunityId) {
        try {
          const opp = await this.omService.findOpportunityById(contract.opportunityId, orgId);
          if (!opp.result) {
            await this.omService.markResult(
              contract.opportunityId,
              orgId,
              OpportunityResult.WON,
              '合同签署自动标记赢单',
              SYSTEM_USER_ID,
              opp.version,
            );
          }
        } catch (err) {
          console.error(`[DealChain] mark opportunity won failed for contract ${contractId}:`, err);
        }
      }

      try {
        await this.ordService.createOrderFromContract(
          orgId,
          contractId,
          contract.quoteId,
          contract.customerId,
          SYSTEM_USER_ID,
        );
      } catch (err) {
        console.error(`[DealChain] create order from contract failed for contract ${contractId}:`, err);
      }
    } catch (err) {
      console.error(`[DealChain] handle contract activated failed for contract ${contractId}:`, err);
    }
  }

  private async handleOrderStatusChanged(event: DomainEvent): Promise<void> {
    const { orgId, aggregateId: orderId } = event;
    const { toStatus } = event.payload as { fromStatus: string; toStatus: string };

    if (toStatus === 'confirmed') {
      try {
        const detail = await this.ordService.findOrderDetail(orderId, orgId);
        const order = detail.order;

        await this.payService.createPayment(orgId, {
          orderId,
          customerId: order.customerId,
          amount: order.totalAmount,
          currency: order.currency,
        }, SYSTEM_USER_ID);
      } catch (err) {
        console.error(`[DealChain] create payment from order failed for order ${orderId}:`, err);
      }
    }

    if (toStatus === 'active') {
      try {
        const detail = await this.ordService.findOrderDetail(orderId, orgId);
        const order = detail.order;

        await this.subService.createSubscriptionFromOrder(
          orgId,
          orderId,
          order.customerId,
          SYSTEM_USER_ID,
        );
      } catch (err) {
        console.error(`[DealChain] create subscription from order failed for order ${orderId}:`, err);
      }
    }
  }

  private async handlePaymentStatusChanged(event: DomainEvent): Promise<void> {
    const { orgId, aggregateId: paymentId } = event;
    const { toStatus } = event.payload as { fromStatus: string; toStatus: string };

    if (toStatus !== 'succeeded') return;

    try {
      const payment = await this.payService.findPaymentById(paymentId, orgId);

      if (payment.orderId) {
        const order = await this.ordService.findOrderById(payment.orderId, orgId);

        if (order.status === 'confirmed') {
          await this.ordService.activateOrder(payment.orderId, orgId, SYSTEM_USER_ID);
        }
      }
    } catch (err) {
      console.error(`[DealChain] activate order after payment succeeded failed for payment ${paymentId}:`, err);
    }
  }
}
