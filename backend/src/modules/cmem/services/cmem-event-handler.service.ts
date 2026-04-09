import { Injectable, OnModuleInit } from '@nestjs/common';
import { EventBusService } from '../../../common/events/event-bus.service';
import { DomainEvent } from '../../../common/events/domain-event';
import { IntentService } from './intent.service';
import { RiskService } from './risk.service';

const STATUS_INTENT_MAP: Record<string, { intentType: string; confidence: number }> = {
  active: { intentType: 'engagement', confidence: 0.7 },
  inactive: { intentType: 'churn_risk', confidence: 0.8 },
  churned: { intentType: 'churn_risk', confidence: 0.95 },
  potential: { intentType: 'inquiry', confidence: 0.6 },
  vip: { intentType: 'renewal', confidence: 0.7 },
};

const STATUS_RISK_MAP: Record<string, { silentDays: number; riskHint: string }> = {
  inactive: { silentDays: 30, riskHint: 'customer_inactive' },
  churned: { silentDays: 90, riskHint: 'customer_churned' },
};

@Injectable()
export class CmemEventHandler implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBusService,
    private readonly intentService: IntentService,
    private readonly riskService: RiskService,
  ) {}

  onModuleInit() {
    this.eventBus.subscribe('customer.status_changed', this.handleCustomerStatusChanged.bind(this));
  }

  private async handleCustomerStatusChanged(event: DomainEvent): Promise<void> {
    const { orgId, aggregateId: customerId } = event;
    const { fromStatus, toStatus } = event.payload as { fromStatus: string; toStatus: string };

    await this.triggerIntentDetection(customerId, orgId, toStatus);

    await this.triggerRiskAssessment(customerId, orgId, toStatus, fromStatus);
  }

  private async triggerIntentDetection(
    customerId: string,
    orgId: string,
    toStatus: string,
  ): Promise<void> {
    try {
      const intentMapping = STATUS_INTENT_MAP[toStatus];
      if (!intentMapping) return;

      await this.intentService.detectIntent(customerId, orgId, {
        content: `客户状态变更为 ${toStatus}，自动识别意图: ${intentMapping.intentType}`,
        sourceType: 'status_change_event',
      });
    } catch (err) {
      console.error(`[CMEM] intent detection failed for customer ${customerId}:`, err);
    }
  }

  private async triggerRiskAssessment(
    customerId: string,
    orgId: string,
    toStatus: string,
    fromStatus: string,
  ): Promise<void> {
    try {
      const riskMapping = STATUS_RISK_MAP[toStatus];
      if (!riskMapping) return;

      await this.riskService.assessRisk(customerId, orgId, {
        silentDays: riskMapping.silentDays,
        statusTransition: `${fromStatus}->${toStatus}`,
        riskHint: riskMapping.riskHint,
        triggerSource: 'status_change_event',
      });
    } catch (err) {
      console.error(`[CMEM] risk assessment failed for customer ${customerId}:`, err);
    }
  }
}
