import { AutoActionExecutor } from './auto-action-executor.service';
import { NtfService } from '../ntf/ntf.service';
import { CsmService } from '../csm/csm.service';
import { NotificationType } from '../ntf/entities/notification.entity';
import { AutomationTrigger } from './entities/automation-trigger.entity';

describe('AutoActionExecutor', () => {
  let executor: AutoActionExecutor;
  let ntfService: any;
  let csmService: any;

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
      evaluateHealth: jest.fn().mockResolvedValue({ id: 'health-1', score: 65 }),
    };

    executor = new AutoActionExecutor(ntfService, csmService);
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

    it('should handle evaluateHealth failure gracefully', async () => {
      csmService.evaluateHealth.mockRejectedValue(new Error('eval failed'));

      const result = await executor.execute(
        mockTrigger,
        { customerId: 'customer-1' },
        'org-1',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('EXECUTION_FAILED');
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

    it('should use default title and content when not provided in payload', async () => {
      const triggerNoPayload = {
        ...mockTrigger,
        actionType: 'send_notification',
        actionPayload: {},
      } as AutomationTrigger;

      const result = await executor.execute(
        triggerNoPayload,
        { toStatus: 'succeeded', fromStatus: 'processing' },
        'org-1',
      );

      expect(result.success).toBe(true);
      expect(ntfService.createNotification).toHaveBeenCalledWith(
        'org-1',
        expect.any(String),
        NotificationType.SYSTEM_ANNOUNCEMENT,
        expect.stringContaining('contract.expiry_warning'),
        expect.stringContaining('合同到期预警触发器'),
        expect.any(String),
        expect.any(String),
      );
    });

    it('should handle createNotification failure gracefully', async () => {
      ntfService.createNotification.mockRejectedValue(new Error('ntf failed'));

      const result = await executor.execute(
        notificationTrigger,
        { toStatus: 'succeeded' },
        'org-1',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('EXECUTION_FAILED');
    });
  });

  describe('log', () => {
    it('should log and return success', async () => {
      const logTrigger = {
        ...mockTrigger,
        actionType: 'log',
      } as AutomationTrigger;

      const result = await executor.execute(
        logTrigger,
        { toStatus: 'active' },
        'org-1',
      );

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

      const result = await executor.execute(
        unknownTrigger,
        {},
        'org-1',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('UNKNOWN_ACTION_TYPE');
    });
  });
});
