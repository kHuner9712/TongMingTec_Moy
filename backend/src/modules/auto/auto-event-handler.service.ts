import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventBusService } from '../../common/events/event-bus.service';
import { DomainEvent } from '../../common/events/domain-event';
import { AutoService } from './auto.service';
import { AutoActionExecutor } from './auto-action-executor.service';
import { FlowService } from './flow.service';

@Injectable()
export class AutoEventHandler implements OnModuleInit {
  private readonly logger = new Logger(AutoEventHandler.name);

  private readonly subscribedEventTypes = new Set<string>([
    'contract.status_changed',
    'contract.expiry_warning',
    'order.status_changed',
    'payment.status_changed',
    'subscription.status_changed',
    'subscription.renewed',
    'quote.status_changed',
    'opportunity.stage_changed',
    'opportunity.result_changed',
    'delivery.risk_reported',
    'dash.metric_anomaly',
    'approval.status_changed',
  ]);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly autoService: AutoService,
    private readonly actionExecutor: AutoActionExecutor,
    private readonly flowService: FlowService,
  ) {}

  onModuleInit() {
    for (const eventType of this.subscribedEventTypes) {
      this.eventBus.subscribe(eventType, this.handleEvent.bind(this));
    }
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    const { eventType } = event;

    if (eventType === 'approval.status_changed') {
      await this.handleApprovalStatusChanged(event);
      return;
    }

    await this.handleTriggers(event);
    await this.handleFlows(event);
  }

  private async handleTriggers(event: DomainEvent): Promise<void> {
    const { orgId, eventType } = event;

    try {
      const triggers = await this.autoService.findActiveTriggersByEventType(orgId, eventType);

      for (const trigger of triggers) {
        const matches = this.autoService.evaluateCondition(
          trigger.condition,
          event.payload,
        );

        if (!matches) continue;

        const result = await this.actionExecutor.execute(
          trigger,
          event.payload,
          orgId,
        );

        await this.autoService.recordExecution(trigger.id, orgId, result.success);

        if (!result.success) {
          this.logger.warn(
            `Trigger action failed: trigger=${trigger.id} event=${eventType} message=${result.message}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        `Auto trigger evaluation failed for event ${eventType}: ${(err as Error).message}`,
      );
    }
  }

  private async handleFlows(event: DomainEvent): Promise<void> {
    const { orgId, eventType } = event;

    try {
      const flows = await this.flowService.findActiveFlowsByEventType(orgId, eventType);

      for (const flow of flows) {
        const run = await this.flowService.executeFlowByEvent(
          flow.id,
          orgId,
          eventType,
          event.payload,
        );

        if (run) {
          this.logger.log(
            `Flow executed: flow=${flow.code} run=${run.id} status=${run.status} event=${eventType}`,
          );
        }
      }
    } catch (err) {
      this.logger.error(
        `Auto flow execution failed for event ${eventType}: ${(err as Error).message}`,
      );
    }
  }

  private async handleApprovalStatusChanged(event: DomainEvent): Promise<void> {
    const { orgId, aggregateId: approvalRequestId } = event;
    const payload = event.payload as {
      toStatus?: string;
      actorId?: string;
      reason?: string;
      resourceType?: string;
    };

    if (payload.resourceType !== 'automation_step') return;
    if (!payload.toStatus) return;

    try {
      const run = await this.flowService.handleApprovalStatusChanged(
        orgId,
        approvalRequestId,
        payload.toStatus,
        payload.actorId,
        payload.reason,
      );

      if (run) {
        this.logger.log(
          `Approval bridged to automation run: approval=${approvalRequestId} run=${run.id} status=${run.status}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `Approval bridge failed: approval=${approvalRequestId} error=${(err as Error).message}`,
      );
    }
  }
}
