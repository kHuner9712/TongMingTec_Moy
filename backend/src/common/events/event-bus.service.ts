import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { DomainEvent } from './domain-event';

type EventHandler = (event: DomainEvent) => void | Promise<void>;

@Injectable()
export class EventBusService implements OnModuleDestroy {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  publish(event: DomainEvent): void {
    const handlers = this.handlers.get(event.eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }
    for (const handler of handlers) {
      Promise.resolve(handler(event)).catch((err) => {
        console.error(
          `[EventBus] handler error for "${event.eventType}":`,
          err,
        );
      });
    }
  }

  subscribe(
    eventType: string,
    handler: (event: DomainEvent) => void | Promise<void>,
  ): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  unsubscribe(
    eventType: string,
    handler: (event: DomainEvent) => void | Promise<void>,
  ): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.handlers.delete(eventType);
      }
    }
  }

  onModuleDestroy(): void {
    this.handlers.clear();
  }
}
