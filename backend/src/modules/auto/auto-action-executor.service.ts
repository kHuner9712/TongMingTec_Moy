import { Injectable, Logger } from '@nestjs/common';
import { AutomationTrigger } from './entities/automation-trigger.entity';
import { NtfService } from '../ntf/ntf.service';
import { CsmService } from '../csm/csm.service';
import { NotificationType } from '../ntf/entities/notification.entity';
import { TskService } from '../tsk/tsk.service';
import { TaskSourceType } from '../tsk/entities/task.entity';
import { CmService } from '../cm/cm.service';
import { DlvService } from '../dlv/dlv.service';

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

type ActionType =
  | 'notify_csm'
  | 'send_notification'
  | 'log'
  | 'create_csm_followup_task'
  | 'append_csm_risk_signal'
  | 'create_service_attention';

export interface AutomationBusinessRef {
  type: string;
  id: string;
  label?: string;
  path?: string;
}

export interface ActionExecutionResult {
  success: boolean;
  message: string;
  errorCode?: string;
  details?: Record<string, unknown>;
  businessRefs?: AutomationBusinessRef[];
}

@Injectable()
export class AutoActionExecutor {
  private readonly logger = new Logger(AutoActionExecutor.name);

  constructor(
    private readonly ntfService: NtfService,
    private readonly csmService: CsmService,
    private readonly tskService: TskService,
    private readonly cmService: CmService,
    private readonly dlvService: DlvService,
  ) {}

  async execute(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
    orgId: string,
  ): Promise<ActionExecutionResult> {
    const actionType = (trigger.actionType || 'log') as ActionType;

    try {
      switch (actionType) {
        case 'notify_csm':
          return await this.executeNotifyCsm(eventPayload, orgId);
        case 'send_notification':
          return await this.executeSendNotification(trigger, eventPayload, orgId);
        case 'create_csm_followup_task':
          return await this.executeCreateCsmFollowupTask(trigger, eventPayload, orgId);
        case 'append_csm_risk_signal':
          return await this.executeAppendCsmRiskSignal(trigger, eventPayload, orgId);
        case 'create_service_attention':
          return await this.executeCreateServiceAttention(trigger, eventPayload, orgId);
        case 'log':
          return this.executeLog(trigger, eventPayload);
        default:
          this.logger.warn(`Unknown actionType: ${actionType} for trigger ${trigger.id}`);
          return {
            success: false,
            message: `UNKNOWN_ACTION_TYPE:${actionType}`,
            errorCode: 'UNKNOWN_ACTION_TYPE',
          };
      }
    } catch (err) {
      const message = (err as Error).message || 'UNKNOWN_ERROR';
      this.logger.error(
        `Action execution failed for trigger "${trigger.name}" (${trigger.id}): ${message}`,
      );
      return {
        success: false,
        message: `EXECUTION_FAILED:${message}`,
        errorCode: 'EXECUTION_FAILED',
      };
    }
  }

  private async executeNotifyCsm(
    eventPayload: Record<string, unknown>,
    orgId: string,
  ): Promise<ActionExecutionResult> {
    const customerId = await this.resolveCustomerId(eventPayload, orgId);
    if (!customerId) {
      return {
        success: false,
        message: 'MISSING_CUSTOMER_ID',
        errorCode: 'MISSING_CUSTOMER_ID',
      };
    }

    const health = await this.csmService.evaluateHealth(
      customerId,
      orgId,
      SYSTEM_USER_ID,
    );

    return {
      success: true,
      message: `CSM_HEALTH_EVALUATED:${customerId}`,
      details: {
        healthLevel: health.level,
        healthScore: health.score,
      },
      businessRefs: [
        {
          type: 'customer',
          id: customerId,
          path: `/workbench/csm/health?customerId=${customerId}`,
          label: '客户健康档案',
        },
      ],
    };
  }

  private async executeSendNotification(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
    orgId: string,
  ): Promise<ActionExecutionResult> {
    const actionPayload = trigger.actionPayload || {};
    const explicitTargets = this.toStringArray(actionPayload.targetUserIds);

    const singleTarget =
      (actionPayload.targetUserId as string) ||
      (eventPayload.ownerUserId as string) ||
      (eventPayload.actorId as string) ||
      SYSTEM_USER_ID;

    const targetUserIds =
      explicitTargets.length > 0
        ? explicitTargets
        : [singleTarget].filter((id): id is string => !!id);

    const title =
      (actionPayload.title as string) ||
      this.buildNotificationTitle(trigger, eventPayload);
    const content =
      (actionPayload.content as string) ||
      this.buildNotificationContent(trigger, eventPayload);

    const notificationType =
      (actionPayload.notificationType as NotificationType) ||
      NotificationType.SYSTEM_ANNOUNCEMENT;

    const sourceType =
      (actionPayload.sourceType as string) ||
      trigger.eventType ||
      'automation';
    const sourceId =
      (eventPayload.deliveryId as string) ||
      (eventPayload.contractId as string) ||
      (eventPayload.subscriptionId as string) ||
      (eventPayload.customerId as string) ||
      trigger.id;

    for (const userId of targetUserIds) {
      await this.ntfService.createNotification(
        orgId,
        userId,
        notificationType,
        title,
        content,
        sourceType,
        sourceId,
      );
    }

    return {
      success: true,
      message: `NOTIFICATION_SENT:${targetUserIds.join(',')}`,
      details: {
        targetUserIds,
      },
      businessRefs: sourceId
        ? [
            {
              type: sourceType,
              id: sourceId,
            },
          ]
        : [],
    };
  }

  private executeLog(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
  ): ActionExecutionResult {
    this.logger.log(
      `log action: trigger=${trigger.name} event=${trigger.eventType} payload=${JSON.stringify(
        eventPayload,
      )}`,
    );

    return { success: true, message: 'LOGGED' };
  }

  private async executeCreateCsmFollowupTask(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
    orgId: string,
  ): Promise<ActionExecutionResult> {
    const actionPayload = trigger.actionPayload || {};
    const customerId = await this.resolveCustomerId(eventPayload, orgId);

    if (!customerId) {
      return {
        success: false,
        message: 'MISSING_CUSTOMER_ID',
        errorCode: 'MISSING_CUSTOMER_ID',
      };
    }

    const ownerUserId = await this.resolveOwnerUserId(
      customerId,
      orgId,
      (actionPayload.targetUserId as string) ||
        (eventPayload.ownerUserId as string) ||
        null,
    );

    const daysUntilExpiry = Number(eventPayload.daysUntilExpiry || 0);
    const dueAt = new Date();
    dueAt.setDate(dueAt.getDate() + (Number.isFinite(daysUntilExpiry) && daysUntilExpiry > 0 ? Math.min(daysUntilExpiry, 14) : 3));

    const contractNo = (eventPayload.contractNo as string) || '';
    const contractId = (eventPayload.contractId as string) || (eventPayload.id as string) || null;

    const task = await this.tskService.createTask(
      orgId,
      {
        title:
          (actionPayload.title as string) ||
          `合同到期跟进${contractNo ? `：${contractNo}` : ''}`,
        description:
          (actionPayload.content as string) ||
          `客户合同临近到期（剩余 ${daysUntilExpiry || '未知'} 天），请发起续约/风险复盘。`,
        assigneeUserId: ownerUserId,
        sourceType: TaskSourceType.CSM,
        sourceId: contractId || customerId,
        dueAt,
      },
      SYSTEM_USER_ID,
    );

    if (ownerUserId) {
      await this.ntfService.createNotification(
        orgId,
        ownerUserId,
        NotificationType.TASK_ASSIGNED,
        '自动化已创建合同到期跟进任务',
        task.title,
        'task',
        task.id,
      );
    }

    return {
      success: true,
      message: `CSM_FOLLOWUP_TASK_CREATED:${task.id}`,
      details: {
        customerId,
        ownerUserId,
      },
      businessRefs: [
        {
          type: 'task',
          id: task.id,
          label: 'CSM 跟进任务',
        },
        {
          type: 'customer',
          id: customerId,
          path: `/workbench/csm/health?customerId=${customerId}`,
        },
        ...(contractId
          ? [
              {
                type: 'contract',
                id: contractId,
                path: `/contracts/${contractId}`,
              },
            ]
          : []),
      ],
    };
  }

  private async executeAppendCsmRiskSignal(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
    orgId: string,
  ): Promise<ActionExecutionResult> {
    const customerId = await this.resolveCustomerId(eventPayload, orgId);
    if (!customerId) {
      return {
        success: false,
        message: 'MISSING_CUSTOMER_ID',
        errorCode: 'MISSING_CUSTOMER_ID',
      };
    }

    const severity = (eventPayload.severity as string) || 'medium';
    const status = (eventPayload.status as string) || 'open';
    const title =
      (eventPayload.title as string) ||
      (trigger.actionPayload?.title as string) ||
      '交付高风险预警';

    const deliveryId = (eventPayload.deliveryId as string) || null;
    const ownerUserId =
      (eventPayload.ownerUserId as string) ||
      (await this.resolveOwnerUserId(customerId, orgId, null));

    await this.csmService.recordAutomationRiskSignal(
      orgId,
      customerId,
      {
        source: 'AUTO_DLV_RISK',
        title,
        severity,
        status,
        relatedType: 'delivery',
        relatedId: deliveryId || undefined,
        detail:
          (eventPayload.reason as string) ||
          (eventPayload.mitigationPlan as string) ||
          null || undefined,
      },
      SYSTEM_USER_ID,
    );

    if (ownerUserId) {
      await this.ntfService.createNotification(
        orgId,
        ownerUserId,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        '交付高风险已写入客户成功风险视图',
        `${title}（${severity}）`,
        'delivery',
        deliveryId || customerId,
      );
    }

    return {
      success: true,
      message: `CSM_RISK_SIGNAL_APPENDED:${customerId}`,
      details: {
        customerId,
        ownerUserId,
        severity,
        status,
      },
      businessRefs: [
        {
          type: 'customer',
          id: customerId,
          path: `/workbench/csm/health?customerId=${customerId}`,
          label: '客户成功风险视图',
        },
        ...(deliveryId
          ? [
              {
                type: 'delivery',
                id: deliveryId,
                path: `/deliveries/${deliveryId}`,
              },
            ]
          : []),
      ],
    };
  }

  private async executeCreateServiceAttention(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
    orgId: string,
  ): Promise<ActionExecutionResult> {
    const actionPayload = trigger.actionPayload || {};
    const ownerUserIds = this.toStringArray(eventPayload.ownerUserIds);
    const fallbackOwner =
      (eventPayload.ownerUserId as string) ||
      (actionPayload.targetUserId as string) ||
      (eventPayload.actorId as string) ||
      null;

    const targetUserIds =
      ownerUserIds.length > 0
        ? ownerUserIds
        : [fallbackOwner].filter((id): id is string => !!id);

    if (targetUserIds.length === 0) {
      return {
        success: false,
        message: 'MISSING_TARGET_OWNER',
        errorCode: 'MISSING_TARGET_OWNER',
      };
    }

    const metricName = (eventPayload.metricName as string) || '服务指标';
    const metricLabel = (eventPayload.currentLabel as string) || '-';
    const metricKey = (eventPayload.metricKey as string) || 'unknown_metric';

    const taskRefs: AutomationBusinessRef[] = [];

    for (const userId of targetUserIds) {
      const task = await this.tskService.createTask(
        orgId,
        {
          title:
            (actionPayload.title as string) ||
            `服务关注项：${metricName}异常`,
          description:
            (actionPayload.content as string) ||
            `指标 ${metricName} 当前为 ${metricLabel}，请在24小时内完成排查与改进动作。`,
          assigneeUserId: userId,
          sourceType: TaskSourceType.AUTOMATION,
          sourceId: metricKey,
          dueAt: this.nextDay(),
        },
        SYSTEM_USER_ID,
      );

      taskRefs.push({ type: 'task', id: task.id, label: `服务关注项(${userId.slice(0, 8)})` });

      await this.ntfService.createNotification(
        orgId,
        userId,
        NotificationType.TASK_ASSIGNED,
        '自动化生成服务关注项',
        task.title,
        'task',
        task.id,
      );
    }

    return {
      success: true,
      message: `SERVICE_ATTENTION_CREATED:${taskRefs.length}`,
      details: {
        targetUserIds,
        metricKey,
      },
      businessRefs: taskRefs,
    };
  }

  private buildNotificationTitle(
    trigger: AutomationTrigger,
    eventPayload: Record<string, unknown>,
  ): string {
    const eventType = trigger.eventType;
    const metricName = (eventPayload.metricName as string) || '';

    if (eventType === 'dash.metric_anomaly') {
      return `指标异常预警：${metricName || eventPayload.metricKey || 'unknown'}`;
    }

    const toStatus = eventPayload.toStatus as string;
    if (toStatus) {
      return `自动化触发：${eventType} -> ${toStatus}`;
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
      parts.push(`状态变化: ${eventPayload.fromStatus || '?'} -> ${eventPayload.toStatus}`);
    }
    if (eventPayload.customerId) {
      parts.push(`客户ID: ${eventPayload.customerId}`);
    }
    if (eventPayload.daysUntilExpiry !== undefined) {
      parts.push(`距到期天数: ${eventPayload.daysUntilExpiry}`);
    }
    if (eventPayload.metricName) {
      parts.push(`异常指标: ${eventPayload.metricName}`);
      parts.push(`当前值: ${eventPayload.currentLabel || eventPayload.currentValue || '-'}`);
    }

    return parts.join('；');
  }

  private async resolveCustomerId(
    eventPayload: Record<string, unknown>,
    orgId: string,
  ): Promise<string | null> {
    const directCustomerId = (eventPayload.customerId as string) || null;
    if (directCustomerId) return directCustomerId;

    const deliveryId = (eventPayload.deliveryId as string) || null;
    if (deliveryId) {
      try {
        const delivery = await this.dlvService.findDeliveryById(deliveryId, orgId);
        return delivery.customerId;
      } catch {
        return null;
      }
    }

    return null;
  }

  private async resolveOwnerUserId(
    customerId: string,
    orgId: string,
    preferred: string | null,
  ): Promise<string | null> {
    if (preferred) return preferred;

    try {
      const customer = await this.cmService.findCustomerById(customerId, orgId);
      return customer.ownerUserId || null;
    } catch {
      return null;
    }
  }

  private toStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string' && item.length > 0);
  }

  private nextDay(): Date {
    const due = new Date();
    due.setDate(due.getDate() + 1);
    return due;
  }
}
