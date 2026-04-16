import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { EventBusService } from '../../common/events/event-bus.service';
import { DomainEvent } from '../../common/events/domain-event';
import { AutoService } from './auto.service';
import { AutoActionExecutor } from './auto-action-executor.service';

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
  ]);

  constructor(
    private readonly eventBus: EventBusService,
    private readonly autoService: AutoService,
    private readonly actionExecutor: AutoActionExecutor,
  ) {}

  onModuleInit() {
    for (const eventType of this.subscribedEventTypes) {
      this.eventBus.subscribe(eventType, this.handleEvent.bind(this));
    }
  }

  private async handleEvent(event: DomainEvent): Promise<void> {
    const { orgId, eventType } = event;

    try {
      const triggers = await this.autoService.findActiveTriggersByEventType(orgId, eventType);

      for (const trigger of triggers) {
        const matches = this.autoService.evaluateCondition(
          trigger.condition,
          event.payload,
        );

        if (matches) {
          this.logger.log(
            `Trigger "${trigger.name}" (${trigger.id}) matched event ${eventType}, ` +
            `action: ${trigger.actionType}`,
          );

          const result = await this.actionExecutor.execute(
            trigger,
            event.payload,
            orgId,
          );

          await this.autoService.recordExecution(trigger.id, orgId, result.success);

          if (!result.success) {
            this.logger.warn(
              `Action execution for trigger "${trigger.name}" returned: ${result.message}`,
            );
          }
        }
      }
    } catch (err) {
      this.logger.error(
        `Auto trigger evaluation failed for event ${eventType}: ${err}`,
      );
    }
  }
}
