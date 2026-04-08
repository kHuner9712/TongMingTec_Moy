import { EventBusService } from './event-bus.service';
import { DomainEvent } from './domain-event';

describe('EventBusService', () => {
  let eventBus: EventBusService;

  beforeEach(() => {
    eventBus = new EventBusService();
  });

  afterEach(() => {
    eventBus.onModuleDestroy();
  });

  const createEvent = (type: string, payload?: Record<string, unknown>): DomainEvent => ({
    eventType: type,
    aggregateType: 'test',
    aggregateId: 'test-id',
    payload: payload || {},
    occurredAt: new Date(),
    orgId: 'org-1',
  });

  it('should call subscribed handler when event is published', () => {
    const handler = jest.fn();
    eventBus.subscribe('test.event', handler);

    const event = createEvent('test.event', { key: 'value' });
    eventBus.publish(event);

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should call multiple handlers for same event type', () => {
    const handler1 = jest.fn();
    const handler2 = jest.fn();
    eventBus.subscribe('test.event', handler1);
    eventBus.subscribe('test.event', handler2);

    const event = createEvent('test.event');
    eventBus.publish(event);

    expect(handler1).toHaveBeenCalledWith(event);
    expect(handler2).toHaveBeenCalledWith(event);
  });

  it('should not call handler for different event type', () => {
    const handler = jest.fn();
    eventBus.subscribe('test.event', handler);

    const event = createEvent('other.event');
    eventBus.publish(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should support unsubscribe', () => {
    const handler = jest.fn();
    eventBus.subscribe('test.event', handler);
    eventBus.unsubscribe('test.event', handler);

    const event = createEvent('test.event');
    eventBus.publish(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should handle async handlers gracefully', async () => {
    const handler = jest.fn().mockResolvedValue(undefined);
    eventBus.subscribe('test.event', handler);

    const event = createEvent('test.event');
    eventBus.publish(event);

    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should not throw when publishing event with no handlers', () => {
    const event = createEvent('unhandled.event');
    expect(() => eventBus.publish(event)).not.toThrow();
  });

  it('should not throw when handler throws', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    const handler = jest.fn().mockRejectedValue(new Error('handler error'));
    eventBus.subscribe('test.event', handler);

    const event = createEvent('test.event');
    expect(() => eventBus.publish(event)).not.toThrow();

    consoleSpy.mockRestore();
  });

  it('should clear all handlers on module destroy', () => {
    const handler = jest.fn();
    eventBus.subscribe('test.event', handler);
    eventBus.onModuleDestroy();

    const event = createEvent('test.event');
    eventBus.publish(event);

    expect(handler).not.toHaveBeenCalled();
  });
});
