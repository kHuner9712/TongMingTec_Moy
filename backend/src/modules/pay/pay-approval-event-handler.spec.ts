import { PayApprovalEventHandler } from './pay-approval-event-handler';
import { EventBusService } from '../../common/events/event-bus.service';
import { PayService } from './pay.service';

describe('PayApprovalEventHandler', () => {
  let handler: PayApprovalEventHandler;
  let eventBus: any;
  let payService: any;

  beforeEach(() => {
    eventBus = { subscribe: jest.fn() };
    payService = {
      succeedPaymentAfterApproval: jest.fn(),
      revertPaymentApproval: jest.fn(),
    };
    handler = new PayApprovalEventHandler(eventBus, payService);
  });

  it('should subscribe to approval.status_changed on module init', () => {
    handler.onModuleInit();
    expect(eventBus.subscribe).toHaveBeenCalledWith('approval.status_changed', expect.any(Function));
  });

  it('should call succeedPaymentAfterApproval when payment succeed is approved', async () => {
    const event = {
      eventType: 'approval.status_changed',
      aggregateType: 'ai_approval_request',
      aggregateId: 'approval-1',
      orgId: 'org-1',
      occurredAt: new Date(),
      payload: {
        fromStatus: 'pending',
        toStatus: 'approved',
        resourceType: 'payment',
        resourceId: 'payment-1',
        requestedAction: 'succeed',
        actorType: 'user',
        actorId: 'user-1',
      },
    };

    await handler['handleApprovalStatusChanged'](event);

    expect(payService.succeedPaymentAfterApproval).toHaveBeenCalledWith('payment-1', 'org-1');
  });

  it('should call revertPaymentApproval when payment succeed is rejected', async () => {
    const event = {
      eventType: 'approval.status_changed',
      aggregateType: 'ai_approval_request',
      aggregateId: 'approval-1',
      orgId: 'org-1',
      occurredAt: new Date(),
      payload: {
        fromStatus: 'pending',
        toStatus: 'rejected',
        resourceType: 'payment',
        resourceId: 'payment-1',
        requestedAction: 'succeed',
        actorType: 'user',
        actorId: 'user-1',
      },
    };

    await handler['handleApprovalStatusChanged'](event);

    expect(payService.revertPaymentApproval).toHaveBeenCalledWith('payment-1', 'org-1');
  });

  it('should ignore non-payment approval events', async () => {
    const event = {
      eventType: 'approval.status_changed',
      aggregateType: 'ai_approval_request',
      aggregateId: 'approval-1',
      orgId: 'org-1',
      occurredAt: new Date(),
      payload: {
        fromStatus: 'pending',
        toStatus: 'approved',
        resourceType: 'order',
        resourceId: 'order-1',
        requestedAction: 'confirm',
        actorType: 'user',
        actorId: 'user-1',
      },
    };

    await handler['handleApprovalStatusChanged'](event);

    expect(payService.succeedPaymentAfterApproval).not.toHaveBeenCalled();
    expect(payService.revertPaymentApproval).not.toHaveBeenCalled();
  });

  it('should ignore events without resourceId', async () => {
    const event = {
      eventType: 'approval.status_changed',
      aggregateType: 'ai_approval_request',
      aggregateId: 'approval-1',
      orgId: 'org-1',
      occurredAt: new Date(),
      payload: {
        fromStatus: 'pending',
        toStatus: 'approved',
        resourceType: 'payment',
        resourceId: undefined,
        requestedAction: 'succeed',
        actorType: 'user',
        actorId: 'user-1',
      },
    };

    await handler['handleApprovalStatusChanged'](event);

    expect(payService.succeedPaymentAfterApproval).not.toHaveBeenCalled();
  });
});
