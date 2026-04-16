import { DomainEvent } from './domain-event';

export function paymentStatusChanged(params: {
  orgId: string;
  paymentId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId: string;
  reason?: string;
}): DomainEvent {
  return {
    eventType: 'payment.status_changed',
    aggregateType: 'payment',
    aggregateId: params.paymentId,
    payload: {
      fromStatus: params.fromStatus,
      toStatus: params.toStatus,
      actorType: params.actorType,
      actorId: params.actorId,
      reason: params.reason,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}
