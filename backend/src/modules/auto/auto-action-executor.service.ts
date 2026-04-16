import { Injectable, Logger } from '@nestjs/common';
import { AutomationTrigger } from './entities/automation-trigger.entity';
import { NtfService } from '../ntf/ntf.service';
import { CsmService } from '../csm/csm.service';
import { NotificationType } from '../ntf/entities/notification.entity';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

export type ActionType = 'notify_csm' | 'send_notification' | 'log';

@Injectable()
export class AutoActionExecutor {
  private readonly logger = new Logger(AutoActionExecutor.name);

  constructor(
    private readonly ntfService: NtfService,
    private readonly csmService: CsmService,
  ) {}

  async execute(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
    orgId: string,
  ): Promise<{ success: boolean; message: string }> {
    const actionType = trigger.actionType as ActionType;
    const actionPayload = trigger.actionPayload || {};

    try {
      switch (actionType) {
        case 'notify_csm':
          return await this.executeNotifyCsm(trigger, eventPayload, orgId);
        case 'send_notification':
          return await this.executeSendNotification(trigger, eventPayload, orgId);
        case 'log':
          return await this.executeLog(trigger, eventPayload);
        default:
          this.logger.warn(`Unknown actionType: ${actionType} for trigger ${trigger.id}`);
          return { success: false, message: `UNKNOWN_ACTION_TYPE:${actionType}` };
      }
    } catch (err) {
      this.logger.error(
        `Action execution failed for trigger "${trigger.name}" (${trigger.id}): ${err}`,
      );
      return { success: false, message: `EXECUTION_FAILED:${(err as Error).message}` };
    }
  }

  private async executeNotifyCsm(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
    orgId: string,
  ): Promise<{ success: boolean; message: string }> {
    const customerId = eventPayload.customerId as string;
    if (!customerId) {
      return { success: false, message: 'MISSING_CUSTOMER_ID' };
    }

    await this.csmService.evaluateHealth(customerId, orgId, SYSTEM_USER_ID);

    this.logger.log(
      `notify_csm: CSM health re-evaluated for customer ${customerId} in org ${orgId}`,
    );

    return { success: true, message: `CSM_HEALTH_EVALUATED:${customerId}` };
  }

  private async executeSendNotification(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
    orgId: string,
  ): Promise<{ success: boolean; message: string }> {
    const actionPayload = trigger.actionPayload || {};
    const targetUserId = (actionPayload.targetUserId as string) ||
      (eventPayload.actorId as string) ||
      SYSTEM_USER_ID;

    const title = (actionPayload.title as string) ||
      this.buildNotificationTitle(trigger, eventPayload);
    const content = (actionPayload.content as string) ||
      this.buildNotificationContent(trigger, eventPayload);

    const notificationType = (actionPayload.notificationType as NotificationType) ||
      NotificationType.SYSTEM_ANNOUNCEMENT;

    const sourceType = (actionPayload.sourceType as string) ||
      trigger.eventType;
    const sourceId = (eventPayload.subscriptionId || eventPayload.contractId ||
      eventPayload.orderId || eventPayload.paymentId || trigger.id) as string;

    await this.ntfService.createNotification(
      orgId,
      targetUserId,
      notificationType,
      title,
      content,
      sourceType,
      sourceId,
    );

    this.logger.log(
      `send_notification: Notification sent to user ${targetUserId} in org ${orgId}`,
    );

    return { success: true, message: `NOTIFICATION_SENT:${targetUserId}` };
  }

  private async executeLog(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(
      `log action: Trigger "${trigger.name}" matched. Event payload: ${JSON.stringify(eventPayload)}`,
    );

    return { success: true, message: 'LOGGED' };
  }

  private buildNotificationTitle(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
  ): string {
    const eventType = trigger.eventType;
    const toStatus = eventPayload.toStatus as string;

    if (toStatus) {
      return `自动化触发：${eventType} → ${toStatus}`;
    }
    return `自动化触发：${eventType}`;
  }

  private buildNotificationContent(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
  ): string {
    const parts: string[] = [];
    parts.push(`触发器: ${trigger.name}`);
    parts.push(`事件: ${trigger.eventType}`);

    if (eventPayload.toStatus) {
      parts.push(`状态变更: ${eventPayload.fromStatus || '?'} → ${eventPayload.toStatus}`);
    }
    if (eventPayload.customerId) {
      parts.push(`客户ID: ${eventPayload.customerId}`);
    }
    if (eventPayload.daysUntilExpiry !== undefined) {
      parts.push(`距到期天数: ${eventPayload.daysUntilExpiry}`);
    }

    return parts.join('；');
  }
}
