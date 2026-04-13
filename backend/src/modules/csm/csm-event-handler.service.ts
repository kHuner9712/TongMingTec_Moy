import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../common/events/event-bus.service';
import { DomainEvent } from '../../common/events/domain-event';
import { CsmService } from './csm.service';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

@Injectable()
export class CsmEventHandler implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly csmService: CsmService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('subscription.opened', this.handleSubscriptionOpened.bind(this));
    this.eventBus.subscribe('contract.expiry_warning', this.handleContractExpiryWarning.bind(this));
  }

  private async handleSubscriptionOpened(event: DomainEvent): Promise<void> {
    const { orgId } = event;
    const { customerId } = event.payload as { orderId: string; customerId: string; actorType: string; actorId: string };

    try {
      await this.csmService.autoEnrollCustomer(orgId, customerId, SYSTEM_USER_ID);
    } catch (err) {
      console.error(`[CSM] auto enroll customer failed for ${customerId}:`, err);
    }
  }

  private async handleContractExpiryWarning(event: DomainEvent): Promise<void> {
    const { orgId } = event;
    const { customerId, contractNo, daysUntilExpiry } = event.payload as {
      contractNo: string;
      customerId: string;
      endsOn: string;
      daysUntilExpiry: number;
    };

    try {
      await this.csmService.evaluateHealth(customerId, orgId, SYSTEM_USER_ID);
    } catch (err) {
      console.error(`[CSM] health re-evaluation on contract expiry warning failed for ${customerId}:`, err);
    }
  }
}
