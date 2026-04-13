import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { DomainEvent } from './domain-event';

type EventHandler = (event: DomainEvent) => void | Promise<void>;

interface DeadLetterEntry {
  event: DomainEvent;
  handlerName: string;
  error: string;
  failedAt: Date;
  retryCount: number;
}

@Injectable()
export class EventBusService implements OnModuleDestroy {
  private readonly logger = new Logger(EventBusService.name);
  private handlers: Map<string, Set<EventHandler>> = new Map();
  private deadLetters: DeadLetterEntry[] = [];
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAYS_MS = [1000, 5000, 30000];

  publish(event: DomainEvent): void {
    const handlers = this.handlers.get(event.eventType);
    if (!handlers || handlers.size === 0) {
      return;
    }
    for (const handler of handlers) {
      this.executeWithRetry(handler, event, 0);
    }
  }

  private executeWithRetry(
    handler: EventHandler,
    event: DomainEvent,
    attempt: number,
  ): void {
    Promise.resolve(handler(event)).catch((err) => {
      const handlerName = handler.name || 'anonymous';

      if (attempt < this.MAX_RETRIES) {
        const delay = this.RETRY_DELAYS_MS[attempt] || 30000;
        this.logger.warn(
          `[EventBus] handler "${handlerName}" failed for "${event.eventType}" (attempt ${attempt + 1}/${this.MAX_RETRIES}), retrying in ${delay}ms: ${err.message}`,
        );

        setTimeout(() => {
          this.executeWithRetry(handler, event, attempt + 1);
        }, delay);
      } else {
        this.logger.error(
          `[EventBus] handler "${handlerName}" exhausted retries for "${event.eventType}": ${err.message}`,
        );

        this.deadLetters.push({
          event,
          handlerName,
          error: err.message || String(err),
          failedAt: new Date(),
          retryCount: attempt,
        });

        if (this.deadLetters.length > 1000) {
          this.deadLetters = this.deadLetters.slice(-500);
        }
      }
    });
  }

  getDeadLetters(limit: number = 50): DeadLetterEntry[] {
    return this.deadLetters.slice(-limit);
  }

  clearDeadLetters(): void {
    this.deadLetters = [];
  }

  getDeadLetterCount(): number {
    return this.deadLetters.length;
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
    this.deadLetters = [];
  }
}
