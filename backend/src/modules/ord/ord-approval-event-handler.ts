import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../common/events/event-bus.service';
import { DomainEvent } from '../../common/events/domain-event';
import { OrdService } from './ord.service';

@Injectable()
export class OrdApprovalEventHandler implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly ordService: OrdService,
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

    if (resourceType !== 'order' || requestedAction !== 'confirm' || !resourceId) return;

    try {
      if (toStatus === 'approved') {
        await this.ordService.confirmOrderAfterApproval(resourceId, orgId);
      } else if (toStatus === 'rejected') {
        await this.ordService.revertOrderApproval(resourceId, orgId);
      }
    } catch (err) {
      console.error(`[OrdApprovalGateway] handle approval ${toStatus} failed for order ${resourceId}:`, err);
    }
  }
}
