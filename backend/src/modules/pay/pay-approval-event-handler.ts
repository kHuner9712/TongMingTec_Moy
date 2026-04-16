import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../common/events/event-bus.service';
import { DomainEvent } from '../../common/events/domain-event';
import { PayService } from './pay.service';

@Injectable()
export class PayApprovalEventHandler implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly payService: PayService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('approval.status_changed', this.handleApprovalStatusChanged.bind(this));
  }

  private async handleApprovalStatusChanged(event: DomainEvent): Promise<void> {
    const { orgId } = event;
    const { toStatus, resourceType, requestedAction, resourceId } = event.payload as {
      fromStatus: string;
      toStatus: string;
      resourceType?: string;
      resourceId?: string;
      requestedAction?: string;
      actorType: string;
      actorId: string;
    };

    if (resourceType !== 'payment' || requestedAction !== 'succeed' || !resourceId) return;

    try {
      if (toStatus === 'approved') {
        await this.payService.succeedPaymentAfterApproval(resourceId, orgId);
      } else if (toStatus === 'rejected') {
        await this.payService.revertPaymentApproval(resourceId, orgId);
      }
    } catch (err) {
      console.error(`[PayApprovalGateway] handle approval ${toStatus} failed for payment ${resourceId}:`, err);
    }
  }
}
