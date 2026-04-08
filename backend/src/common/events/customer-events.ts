import { DomainEvent } from './domain-event';

export function customerCreated(params: {
  orgId: string;
  customerId: string;
  name: string;
  source?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'customer.created',
    aggregateType: 'customer',
    aggregateId: params.customerId,
    payload: {
      name: params.name,
      source: params.source,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function customerStatusChanged(params: {
  orgId: string;
  customerId: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'customer.status_changed',
    aggregateType: 'customer',
    aggregateId: params.customerId,
    payload: {
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      reason: params.reason,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}
