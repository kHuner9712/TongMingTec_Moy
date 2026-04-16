import { AutoActionExecutor } from './auto-action-executor.service';
import { NotificationType } from '../ntf/entities/notification.entity';
import { AutomationTrigger } from './entities/automation-trigger.entity';

describe('AutoActionExecutor', () => {
  let executor: AutoActionExecutor;
  let ntfService: any;
  let csmService: any;
  let tskService: any;
  let cmService: any;
  let dlvService: any;

  const mockTrigger = {
    id: 'trigger-1',
    orgId: 'org-1',
    name: '合同到期预警触发器',
    eventType: 'contract.expiry_warning',
    actionType: 'notify_csm',
    condition: {},
    actionPayload: {},
    status: 'active' as const,
    executionCount: 0,
    failureCount: 0,
    lastExecutedAt: null,
  } as AutomationTrigger;

  beforeEach(() => {
    ntfService = {
      createNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };
    csmService = {
      evaluateHealth: jest.fn().mockResolvedValue({ id: 'health-1', score: 65, level: 'medium' }),
      recordAutomationRiskSignal: jest.fn().mockResolvedValue({ id: 'health-1' }),
    };
    tskService = {
      createTask: jest.fn().mockResolvedValue({ id: 'task-1', title: 'task' }),
    };
    cmService = {
      findCustomerById: jest.fn().mockResolvedValue({ id: 'customer-1', ownerUserId: 'owner-1' }),
    };
    dlvService = {
      findDeliveryById: jest.fn().mockResolvedValue({ id: 'delivery-1', customerId: 'customer-1' }),
    };

    executor = new AutoActionExecutor(
      ntfService,
      csmService,
      tskService,
      cmService,
      dlvService,
    );
  });

  describe('notify_csm', () => {
    it('should call csmService.evaluateHealth with customerId from event', async () => {
      const result = await executor.execute(
        mockTrigger,
        { customerId: 'customer-1', daysUntilExpiry: 15 },
        'org-1',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('CSM_HEALTH_EVALUATED');
      expect(csmService.evaluateHealth).toHaveBeenCalledWith(
        'customer-1',
        'org-1',
        expect.any(String),
      );
    });

    it('should return failure when customerId is missing', async () => {
      const result = await executor.execute(
        mockTrigger,
        { daysUntilExpiry: 15 },
        'org-1',
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('MISSING_CUSTOMER_ID');
      expect(csmService.evaluateHealth).not.toHaveBeenCalled();
    });
  });

  describe('send_notification', () => {
    const notificationTrigger = {
      ...mockTrigger,
      actionType: 'send_notification',
      actionPayload: {
        title: '付款成功通知',
        content: '您的付款已成功处理',
        notificationType: NotificationType.SYSTEM_ANNOUNCEMENT,
      },
    } as AutomationTrigger;

    it('should call ntfService.createNotification with payload data', async () => {
      const result = await executor.execute(
        notificationTrigger,
        { toStatus: 'succeeded', actorId: 'user-1' },
        'org-1',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('NOTIFICATION_SENT');
      expect(ntfService.createNotification).toHaveBeenCalledWith(
        'org-1',
        'user-1',
        NotificationType.SYSTEM_ANNOUNCEMENT,
        '付款成功通知',
        '您的付款已成功处理',
        expect.any(String),
        expect.any(String),
      );
    });
  });

  describe('create_csm_followup_task', () => {
    it('should create followup task and notify owner', async () => {
      const trigger = {
        ...mockTrigger,
        actionType: 'create_csm_followup_task',
      } as AutomationTrigger;

      const result = await executor.execute(
        trigger,
        {
          customerId: 'customer-1',
          contractId: 'contract-1',
          contractNo: 'CT-001',
          daysUntilExpiry: 5,
        },
        'org-1',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('CSM_FOLLOWUP_TASK_CREATED');
      expect(tskService.createTask).toHaveBeenCalled();
      expect(ntfService.createNotification).toHaveBeenCalled();
    });
  });

  describe('append_csm_risk_signal', () => {
    it('should append risk signal and notify owner', async () => {
      const trigger = {
        ...mockTrigger,
        actionType: 'append_csm_risk_signal',
      } as AutomationTrigger;

      const result = await executor.execute(
        trigger,
        {
          customerId: 'customer-1',
          deliveryId: 'delivery-1',
          ownerUserId: 'owner-1',
          title: '里程碑延期',
          severity: 'high',
          status: 'open',
        },
        'org-1',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('CSM_RISK_SIGNAL_APPENDED');
      expect(csmService.recordAutomationRiskSignal).toHaveBeenCalled();
      expect(ntfService.createNotification).toHaveBeenCalled();
    });
  });

  describe('create_service_attention', () => {
    it('should create attention tasks for owners', async () => {
      const trigger = {
        ...mockTrigger,
        actionType: 'create_service_attention',
      } as AutomationTrigger;

      const result = await executor.execute(
        trigger,
        {
          metricKey: 'first_response_time',
          metricName: '首响时间',
          currentLabel: '45 分钟',
          ownerUserIds: ['owner-1', 'owner-2'],
        },
        'org-1',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('SERVICE_ATTENTION_CREATED');
      expect(tskService.createTask).toHaveBeenCalledTimes(2);
      expect(ntfService.createNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('log', () => {
    it('should log and return success', async () => {
      const logTrigger = {
        ...mockTrigger,
        actionType: 'log',
      } as AutomationTrigger;

      const result = await executor.execute(logTrigger, { toStatus: 'active' }, 'org-1');

      expect(result.success).toBe(true);
      expect(result.message).toBe('LOGGED');
    });
  });

  describe('unknown actionType', () => {
    it('should return failure for unknown actionType', async () => {
      const unknownTrigger = {
        ...mockTrigger,
        actionType: 'unknown_action',
      } as AutomationTrigger;

      const result = await executor.execute(unknownTrigger, {}, 'org-1');

      expect(result.success).toBe(false);
      expect(result.message).toContain('UNKNOWN_ACTION_TYPE');
    });
  });
});
