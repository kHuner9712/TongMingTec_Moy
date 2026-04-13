import { DomainEvent } from './domain-event';

export function subscriptionStatusChanged(params: {
  orgId: string;
  subscriptionId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'subscription.status_changed',
    aggregateType: 'subscription',
    aggregateId: params.subscriptionId,
    payload: {
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function subscriptionOpened(params: {
  orgId: string;
  subscriptionId: string;
  orderId: string;
  customerId: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'subscription.opened',
    aggregateType: 'subscription',
    aggregateId: params.subscriptionId,
    payload: {
      orderId: params.orderId,
      customerId: params.customerId,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}
