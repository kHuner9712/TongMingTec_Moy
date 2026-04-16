import { OrdApprovalEventHandler } from './ord-approval-event-handler';
import { EventBusService } from '../../common/events/event-bus.service';
import { OrdService } from './ord.service';

describe('OrdApprovalEventHandler', () => {
  let handler: OrdApprovalEventHandler;
  let eventBus: any;
  let ordService: any;

  beforeEach(() => {
    eventBus = { subscribe: jest.fn() };
    ordService = {
      confirmOrderAfterApproval: jest.fn(),
      revertOrderApproval: jest.fn(),
    };
    handler = new OrdApprovalEventHandler(eventBus, ordService);
  });

  it('should subscribe to approval.status_changed on module init', () => {
    handler.onModuleInit();
    expect(eventBus.subscribe).toHaveBeenCalledWith('approval.status_changed', expect.any(Function));
  });

  it('should call confirmOrderAfterApproval when order confirm is approved', async () => {
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

    expect(ordService.confirmOrderAfterApproval).toHaveBeenCalledWith('order-1', 'org-1');
  });

  it('should call revertOrderApproval when order confirm is rejected', async () => {
    const event = {
      eventType: 'approval.status_changed',
      aggregateType: 'ai_approval_request',
      aggregateId: 'approval-1',
      orgId: 'org-1',
      occurredAt: new Date(),
      payload: {
        fromStatus: 'pending',
        toStatus: 'rejected',
        resourceType: 'order',
        resourceId: 'order-1',
        requestedAction: 'confirm',
        actorType: 'user',
        actorId: 'user-1',
      },
    };

    await handler['handleApprovalStatusChanged'](event);

    expect(ordService.revertOrderApproval).toHaveBeenCalledWith('order-1', 'org-1');
  });

  it('should ignore non-order approval events', async () => {
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

    expect(ordService.confirmOrderAfterApproval).not.toHaveBeenCalled();
    expect(ordService.revertOrderApproval).not.toHaveBeenCalled();
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
        resourceType: 'order',
        resourceId: undefined,
        requestedAction: 'confirm',
        actorType: 'user',
        actorId: 'user-1',
      },
    };

    await handler['handleApprovalStatusChanged'](event);

    expect(ordService.confirmOrderAfterApproval).not.toHaveBeenCalled();
  });
});
