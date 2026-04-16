import { DlvEventHandler } from './dlv-event-handler.service';
import { DomainEvent } from '../../common/events/domain-event';

describe('DlvEventHandler', () => {
  let handler: DlvEventHandler;
  let eventBus: { subscribe: jest.Mock };
  let ordService: any;
  let payService: any;
  let dlvService: any;

  const mockOrder = {
    id: 'order-1',
    customerId: 'customer-1',
    contractId: 'contract-1',
    createdBy: 'user-1',
  };

  const mockDelivery = {
    id: 'dlv-1',
    orderId: 'order-1',
    status: 'active',
    startedAt: new Date('2026-04-17T00:00:00.000Z'),
  };

  const getSubscribedHandler = (eventType: string): ((event: DomainEvent) => Promise<void>) => {
    const subscribed = eventBus.subscribe.mock.calls.find(
      (call: [string, (event: DomainEvent) => Promise<void>]) => call[0] === eventType,
    );
    if (!subscribed) throw new Error(`Handler for ${eventType} is not subscribed`);
    return subscribed[1];
  };

  beforeEach(() => {
    eventBus = { subscribe: jest.fn() };
    ordService = {
      findOrderDetail: jest.fn(),
      markSubscriptionOpened: jest.fn(),
      markDeliveryStarted: jest.fn(),
    };
    payService = {
      findPaymentById: jest.fn(),
    };
    dlvService = {
      ensureDeliveryForActivatedOrder: jest.fn(),
      bindSubscriptionToOrderDelivery: jest.fn(),
      bindPaymentToOrderDelivery: jest.fn(),
      findDeliveryById: jest.fn(),
    };

    handler = new DlvEventHandler(eventBus as any, ordService, payService, dlvService);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should subscribe to order/subscription/payment/delivery events', () => {
    handler.onModuleInit();

    expect(eventBus.subscribe).toHaveBeenCalledWith(
      'order.status_changed',
      expect.any(Function),
    );
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      'subscription.opened',
      expect.any(Function),
    );
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      'payment.status_changed',
      expect.any(Function),
    );
    expect(eventBus.subscribe).toHaveBeenCalledWith(
      'delivery.status_changed',
      expect.any(Function),
    );
  });

  describe('order.active -> ensure delivery', () => {
    it('should create/ensure delivery when order status changes to active', async () => {
      ordService.findOrderDetail.mockResolvedValue({ order: mockOrder, items: [] });
      dlvService.ensureDeliveryForActivatedOrder.mockResolvedValue(mockDelivery);

      handler.onModuleInit();
      const orderHandler = getSubscribedHandler('order.status_changed');

      await orderHandler({
        eventType: 'order.status_changed',
        aggregateType: 'order',
        aggregateId: 'order-1',
        orgId: 'org-1',
        occurredAt: new Date(),
        payload: { fromStatus: 'confirmed', toStatus: 'active' },
      } as DomainEvent);

      expect(ordService.findOrderDetail).toHaveBeenCalledWith('order-1', 'org-1');
      expect(dlvService.ensureDeliveryForActivatedOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          orgId: 'org-1',
          orderId: 'order-1',
          customerId: 'customer-1',
          contractId: 'contract-1',
          ownerUserId: 'user-1',
        }),
      );
    });

    it('should ignore non-active order status changes', async () => {
      handler.onModuleInit();
      const orderHandler = getSubscribedHandler('order.status_changed');

      await orderHandler({
        eventType: 'order.status_changed',
        aggregateType: 'order',
        aggregateId: 'order-1',
        orgId: 'org-1',
        occurredAt: new Date(),
        payload: { fromStatus: 'draft', toStatus: 'confirmed' },
      } as DomainEvent);

      expect(ordService.findOrderDetail).not.toHaveBeenCalled();
      expect(dlvService.ensureDeliveryForActivatedOrder).not.toHaveBeenCalled();
    });

    it('should tolerate duplicate active events by delegating idempotency to dlvService', async () => {
      ordService.findOrderDetail.mockResolvedValue({ order: mockOrder, items: [] });
      dlvService.ensureDeliveryForActivatedOrder.mockResolvedValue(mockDelivery);

      handler.onModuleInit();
      const orderHandler = getSubscribedHandler('order.status_changed');
      const event = {
        eventType: 'order.status_changed',
        aggregateType: 'order',
        aggregateId: 'order-1',
        orgId: 'org-1',
        occurredAt: new Date(),
        payload: { fromStatus: 'confirmed', toStatus: 'active' },
      } as DomainEvent;

      await orderHandler(event);
      await orderHandler(event);

      expect(dlvService.ensureDeliveryForActivatedOrder).toHaveBeenCalledTimes(2);
    });
  });

  describe('subscription.opened -> bind delivery + mark order timestamp', () => {
    it('should bind subscription to delivery and mark order subscriptionOpenedAt', async () => {
      dlvService.bindSubscriptionToOrderDelivery.mockResolvedValue(mockDelivery);
      ordService.markSubscriptionOpened.mockResolvedValue(undefined);

      handler.onModuleInit();
      const subOpenedHandler = getSubscribedHandler('subscription.opened');

      await subOpenedHandler({
        eventType: 'subscription.opened',
        aggregateType: 'subscription',
        aggregateId: 'sub-1',
        orgId: 'org-1',
        occurredAt: new Date('2026-04-17T08:00:00.000Z'),
        payload: {
          orderId: 'order-1',
          customerId: 'customer-1',
          actorType: 'user',
          actorId: 'user-1',
        },
      } as DomainEvent);

      expect(dlvService.bindSubscriptionToOrderDelivery).toHaveBeenCalledWith(
        'org-1',
        'order-1',
        'sub-1',
        'customer-1',
        '00000000-0000-0000-0000-000000000000',
      );
      expect(ordService.markSubscriptionOpened).toHaveBeenCalledWith(
        'order-1',
        'org-1',
        new Date('2026-04-17T08:00:00.000Z'),
        '00000000-0000-0000-0000-000000000000',
      );
    });

    it('should ignore subscription events without orderId/customerId', async () => {
      handler.onModuleInit();
      const subOpenedHandler = getSubscribedHandler('subscription.opened');

      await subOpenedHandler({
        eventType: 'subscription.opened',
        aggregateType: 'subscription',
        aggregateId: 'sub-1',
        orgId: 'org-1',
        occurredAt: new Date(),
        payload: {
          orderId: '',
          customerId: '',
          actorType: 'user',
          actorId: 'user-1',
        },
      } as DomainEvent);

      expect(dlvService.bindSubscriptionToOrderDelivery).not.toHaveBeenCalled();
      expect(ordService.markSubscriptionOpened).not.toHaveBeenCalled();
    });
  });

  describe('payment.succeeded -> bind payment on delivery', () => {
    it('should bind succeeded payment to delivery', async () => {
      payService.findPaymentById.mockResolvedValue({
        id: 'pay-1',
        orderId: 'order-1',
      });
      dlvService.bindPaymentToOrderDelivery.mockResolvedValue(mockDelivery);

      handler.onModuleInit();
      const paymentHandler = getSubscribedHandler('payment.status_changed');

      await paymentHandler({
        eventType: 'payment.status_changed',
        aggregateType: 'payment',
        aggregateId: 'pay-1',
        orgId: 'org-1',
        occurredAt: new Date(),
        payload: { fromStatus: 'processing', toStatus: 'succeeded' },
      } as DomainEvent);

      expect(payService.findPaymentById).toHaveBeenCalledWith('pay-1', 'org-1');
      expect(dlvService.bindPaymentToOrderDelivery).toHaveBeenCalledWith(
        'org-1',
        'order-1',
        'pay-1',
        '00000000-0000-0000-0000-000000000000',
      );
    });

    it('should keep idempotent behavior when payment is already bound', async () => {
      payService.findPaymentById.mockResolvedValue({
        id: 'pay-1',
        orderId: 'order-1',
      });
      dlvService.bindPaymentToOrderDelivery.mockResolvedValue(mockDelivery);

      handler.onModuleInit();
      const paymentHandler = getSubscribedHandler('payment.status_changed');
      const event = {
        eventType: 'payment.status_changed',
        aggregateType: 'payment',
        aggregateId: 'pay-1',
        orgId: 'org-1',
        occurredAt: new Date(),
        payload: { fromStatus: 'processing', toStatus: 'succeeded' },
      } as DomainEvent;

      await paymentHandler(event);
      await paymentHandler(event);

      expect(dlvService.bindPaymentToOrderDelivery).toHaveBeenCalledTimes(2);
    });

    it('should ignore succeeded payment event when payment has no orderId', async () => {
      payService.findPaymentById.mockResolvedValue({
        id: 'pay-1',
        orderId: null,
      });

      handler.onModuleInit();
      const paymentHandler = getSubscribedHandler('payment.status_changed');

      await paymentHandler({
        eventType: 'payment.status_changed',
        aggregateType: 'payment',
        aggregateId: 'pay-1',
        orgId: 'org-1',
        occurredAt: new Date(),
        payload: { fromStatus: 'processing', toStatus: 'succeeded' },
      } as DomainEvent);

      expect(dlvService.bindPaymentToOrderDelivery).not.toHaveBeenCalled();
    });
  });
});
