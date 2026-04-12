import { DomainEvent } from './domain-event';

export function orderStatusChanged(params: {
  orgId: string;
  orderId: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'order.status_changed',
    aggregateType: 'order',
    aggregateId: params.orderId,
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
