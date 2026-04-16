import { CsmEventHandler } from './csm-event-handler.service';
import { CsmService } from './csm.service';
import { EventBusService } from '../../common/events/event-bus.service';

describe('CsmEventHandler', () => {
  let handler: CsmEventHandler;
  let eventBus: any;
  let csmService: any;

  beforeEach(() => {
    csmService = {
      autoEnrollCustomer: jest.fn(),
      evaluateHealth: jest.fn(),
    };
    eventBus = { subscribe: jest.fn() };

    handler = new CsmEventHandler(eventBus, csmService);
  });

  describe('onModuleInit', () => {
    it('should subscribe to subscription.opened / contract.expiry_warning / delivery.status_changed events', () => {
      handler.onModuleInit();

      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'subscription.opened',
        expect.any(Function),
      );
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'contract.expiry_warning',
        expect.any(Function),
      );
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'delivery.status_changed',
        expect.any(Function),
      );
    });
  });

  describe('subscription.opened -> autoEnrollCustomer', () => {
    it('should auto enroll customer when subscription is opened', async () => {
      csmService.autoEnrollCustomer.mockResolvedValue({});

      handler.onModuleInit();

      const subOpenedHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'subscription.opened',
      )?.[1];

      await subOpenedHandler({
        eventType: 'subscription.opened',
        aggregateType: 'subscription',
        aggregateId: 'sub-1',
        orgId: 'org-1',
        payload: {
          orderId: 'order-1',
          customerId: 'customer-1',
          actorType: 'user',
          actorId: 'user-1',
        },
      });

      expect(csmService.autoEnrollCustomer).toHaveBeenCalledWith(
        'org-1',
        'customer-1',
        expect.any(String),
      );
    });

    it('should handle autoEnrollCustomer failure gracefully', async () => {
      csmService.autoEnrollCustomer.mockRejectedValue(new Error('enroll failed'));

      handler.onModuleInit();

      const subOpenedHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'subscription.opened',
      )?.[1];

      await subOpenedHandler({
        eventType: 'subscription.opened',
        aggregateType: 'subscription',
        aggregateId: 'sub-1',
        orgId: 'org-1',
        payload: {
          orderId: 'order-1',
          customerId: 'customer-1',
          actorType: 'user',
          actorId: 'user-1',
        },
      });

      expect(csmService.autoEnrollCustomer).toHaveBeenCalled();
    });
  });

  describe('contract.expiry_warning -> evaluateHealth', () => {
    it('should re-evaluate customer health when contract expiry warning is received', async () => {
      csmService.evaluateHealth.mockResolvedValue({});

      handler.onModuleInit();

      const expiryHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'contract.expiry_warning',
      )?.[1];

      await expiryHandler({
        eventType: 'contract.expiry_warning',
        aggregateType: 'contract',
        aggregateId: 'contract-1',
        orgId: 'org-1',
        payload: {
          contractNo: 'CT-2026-00001',
          customerId: 'customer-1',
          endsOn: '2026-05-01',
          daysUntilExpiry: 15,
        },
      });

      expect(csmService.evaluateHealth).toHaveBeenCalledWith(
        'customer-1',
        'org-1',
        expect.any(String),
      );
    });

    it('should handle evaluateHealth failure gracefully', async () => {
      csmService.evaluateHealth.mockRejectedValue(new Error('eval failed'));

      handler.onModuleInit();

      const expiryHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'contract.expiry_warning',
      )?.[1];

      await expiryHandler({
        eventType: 'contract.expiry_warning',
        aggregateType: 'contract',
        aggregateId: 'contract-1',
        orgId: 'org-1',
        payload: {
          contractNo: 'CT-2026-00001',
          customerId: 'customer-1',
          endsOn: '2026-05-01',
          daysUntilExpiry: 15,
        },
      });

      expect(csmService.evaluateHealth).toHaveBeenCalled();
    });
  });

  describe('delivery.status_changed -> evaluateHealth with delivery signal', () => {
    it('should re-evaluate health for accepted delivery', async () => {
      csmService.evaluateHealth.mockResolvedValue({});

      handler.onModuleInit();

      const deliveryHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'delivery.status_changed',
      )?.[1];

      await deliveryHandler({
        eventType: 'delivery.status_changed',
        aggregateType: 'delivery',
        aggregateId: 'dlv-1',
        orgId: 'org-1',
        payload: {
          customerId: 'customer-1',
          fromStatus: 'ready_for_acceptance',
          toStatus: 'accepted',
          actorType: 'user',
          actorId: 'user-1',
        },
      });

      expect(csmService.evaluateHealth).toHaveBeenCalledWith(
        'customer-1',
        'org-1',
        expect.any(String),
        expect.objectContaining({
          deliveryId: 'dlv-1',
          deliveryStatus: 'accepted',
        }),
      );
    });
  });
});
