import { DomainEvent } from './domain-event';

export function approvalStatusChanged(params: {
  orgId: string;
  approvalId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId: string;
  reason?: string;
}): DomainEvent {
  return {
    eventType: 'approval.status_changed',
    aggregateType: 'ai_approval_request',
    aggregateId: params.approvalId,
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
