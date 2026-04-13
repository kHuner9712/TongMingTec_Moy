import { DealChainEventHandler } from './deal-chain-event-handler.service';
import { CtService } from '../ct/ct.service';
import { OmService } from '../om/om.service';
import { OrdService } from '../ord/ord.service';
import { PayService } from '../pay/pay.service';
import { SubService } from '../sub/sub.service';
import { EventBusService } from '../../common/events/event-bus.service';

describe('DealChainEventHandler', () => {
  let handler: DealChainEventHandler;
  let eventBus: any;
  let ctService: any;
  let omService: any;
  let ordService: any;
  let payService: any;
  let subService: any;

  const mockContract = {
    id: 'contract-1',
    orgId: 'org-1',
    opportunityId: 'opp-1',
    quoteId: 'quote-1',
    customerId: 'customer-1',
    status: 'active',
  };

  const mockOpportunity = {
    id: 'opp-1',
    orgId: 'org-1',
    result: null,
    version: 1,
  };

  const mockOrder = {
    id: 'order-1',
    orgId: 'org-1',
    customerId: 'customer-1',
    totalAmount: 10000,
    currency: 'CNY',
    status: 'confirmed',
  };

  const mockPayment = {
    id: 'payment-1',
    orgId: 'org-1',
    orderId: 'order-1',
    customerId: 'customer-1',
    status: 'succeeded',
  };

  beforeEach(() => {
    ctService = {
      findContractDetail: jest.fn(),
    };
    omService = {
      findOpportunityById: jest.fn(),
      markResult: jest.fn(),
    };
    ordService = {
      findOrderDetail: jest.fn(),
      findOrderById: jest.fn(),
      createOrderFromContract: jest.fn(),
      activateOrder: jest.fn(),
    };
    payService = {
      createPayment: jest.fn(),
      findPaymentById: jest.fn(),
    };
    subService = {
      createSubscriptionFromOrder: jest.fn(),
    };
    eventBus = { subscribe: jest.fn() };

    handler = new DealChainEventHandler(
      eventBus,
      ctService,
      omService,
      ordService,
      payService,
      subService,
    );
  });

  describe('onModuleInit', () => {
    it('should subscribe to contract, order, and payment status change events', () => {
      handler.onModuleInit();

      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'contract.status_changed',
        expect.any(Function),
      );
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'order.status_changed',
        expect.any(Function),
      );
      expect(eventBus.subscribe).toHaveBeenCalledWith(
        'payment.status_changed',
        expect.any(Function),
      );
    });
  });

  describe('contract activated -> opportunity won + order created', () => {
    it('should mark opportunity as won and create order when contract is activated', async () => {
      ctService.findContractDetail.mockResolvedValue({
        contract: mockContract,
        approvals: [],
        documents: [],
      });
      omService.findOpportunityById.mockResolvedValue(mockOpportunity);
      omService.markResult.mockResolvedValue({ ...mockOpportunity, result: 'won' });
      ordService.createOrderFromContract.mockResolvedValue(mockOrder);

      await handler.onModuleInit();

      const contractHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'contract.status_changed',
      )?.[1];

      await contractHandler({
        eventType: 'contract.status_changed',
        aggregateType: 'contract',
        aggregateId: 'contract-1',
        orgId: 'org-1',
        payload: { fromStatus: 'signing', toStatus: 'active' },
      });

      expect(omService.markResult).toHaveBeenCalledWith(
        'opp-1', 'org-1', 'won', '合同签署自动标记赢单', expect.any(String), 1,
      );
      expect(ordService.createOrderFromContract).toHaveBeenCalledWith(
        'org-1', 'contract-1', 'quote-1', 'customer-1', expect.any(String),
      );
    });

    it('should not trigger chain for non-active contract status', async () => {
      await handler.onModuleInit();

      const contractHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'contract.status_changed',
      )?.[1];

      await contractHandler({
        eventType: 'contract.status_changed',
        aggregateType: 'contract',
        aggregateId: 'contract-1',
        orgId: 'org-1',
        payload: { fromStatus: 'draft', toStatus: 'pending_approval' },
      });

      expect(omService.markResult).not.toHaveBeenCalled();
      expect(ordService.createOrderFromContract).not.toHaveBeenCalled();
    });

    it('should continue creating order even if opportunity mark fails', async () => {
      ctService.findContractDetail.mockResolvedValue({
        contract: mockContract,
        approvals: [],
        documents: [],
      });
      omService.findOpportunityById.mockRejectedValue(new Error('opp not found'));
      ordService.createOrderFromContract.mockResolvedValue(mockOrder);

      await handler.onModuleInit();

      const contractHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'contract.status_changed',
      )?.[1];

      await contractHandler({
        eventType: 'contract.status_changed',
        aggregateType: 'contract',
        aggregateId: 'contract-1',
        orgId: 'org-1',
        payload: { fromStatus: 'signing', toStatus: 'active' },
      });

      expect(ordService.createOrderFromContract).toHaveBeenCalled();
    });
  });

  describe('order confirmed -> payment created', () => {
    it('should create payment when order is confirmed', async () => {
      ordService.findOrderDetail.mockResolvedValue({ order: mockOrder, items: [] });
      payService.createPayment.mockResolvedValue(mockPayment);

      await handler.onModuleInit();

      const orderHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'order.status_changed',
      )?.[1];

      await orderHandler({
        eventType: 'order.status_changed',
        aggregateType: 'order',
        aggregateId: 'order-1',
        orgId: 'org-1',
        payload: { fromStatus: 'draft', toStatus: 'confirmed' },
      });

      expect(payService.createPayment).toHaveBeenCalledWith(
        'org-1',
        expect.objectContaining({
          orderId: 'order-1',
          customerId: 'customer-1',
          amount: 10000,
          currency: 'CNY',
        }),
        expect.any(String),
      );
    });
  });

  describe('order activated -> subscription created', () => {
    it('should create subscription when order is activated', async () => {
      ordService.findOrderDetail.mockResolvedValue({ order: { ...mockOrder, status: 'active' }, items: [] });
      subService.createSubscriptionFromOrder.mockResolvedValue({ id: 'sub-1' });

      await handler.onModuleInit();

      const orderHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'order.status_changed',
      )?.[1];

      await orderHandler({
        eventType: 'order.status_changed',
        aggregateType: 'order',
        aggregateId: 'order-1',
        orgId: 'org-1',
        payload: { fromStatus: 'confirmed', toStatus: 'active' },
      });

      expect(subService.createSubscriptionFromOrder).toHaveBeenCalledWith(
        'org-1', 'order-1', 'customer-1', expect.any(String),
      );
    });
  });

  describe('payment succeeded -> order activated', () => {
    it('should activate order when payment succeeds', async () => {
      payService.findPaymentById.mockResolvedValue(mockPayment);
      ordService.findOrderById.mockResolvedValue(mockOrder);
      ordService.activateOrder.mockResolvedValue({ ...mockOrder, status: 'active' });

      await handler.onModuleInit();

      const paymentHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'payment.status_changed',
      )?.[1];

      await paymentHandler({
        eventType: 'payment.status_changed',
        aggregateType: 'payment',
        aggregateId: 'payment-1',
        orgId: 'org-1',
        payload: { fromStatus: 'processing', toStatus: 'succeeded' },
      });

      expect(ordService.activateOrder).toHaveBeenCalledWith(
        'order-1', 'org-1', expect.any(String),
      );
    });

    it('should not activate order if order is not in confirmed status', async () => {
      payService.findPaymentById.mockResolvedValue(mockPayment);
      ordService.findOrderById.mockResolvedValue({ ...mockOrder, status: 'draft' });

      await handler.onModuleInit();

      const paymentHandler = eventBus.subscribe.mock.calls.find(
        (call: any[]) => call[0] === 'payment.status_changed',
      )?.[1];

      await paymentHandler({
        eventType: 'payment.status_changed',
        aggregateType: 'payment',
        aggregateId: 'payment-1',
        orgId: 'org-1',
        payload: { fromStatus: 'processing', toStatus: 'succeeded' },
      });

      expect(ordService.activateOrder).not.toHaveBeenCalled();
    });
  });
});
