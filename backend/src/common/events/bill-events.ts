import { DomainEvent } from './domain-event';

export function billStatusChanged(params: {
  orgId: string;
  billId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId: string;
  reason?: string;
}): DomainEvent {
  return {
    eventType: 'bill.status_changed',
    aggregateType: 'bill',
    aggregateId: params.billId,
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
