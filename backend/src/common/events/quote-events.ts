import { DomainEvent } from './domain-event';

export function quoteStatusChanged(params: {
  orgId: string;
  quoteId: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'quote.status_changed',
    aggregateType: 'quote',
    aggregateId: params.quoteId,
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

export function quoteApprovalCreated(params: {
  orgId: string;
  quoteId: string;
  approverIds: string[];
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'quote.approval_created',
    aggregateType: 'quote',
    aggregateId: params.quoteId,
    payload: {
      approverIds: params.approverIds,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function quoteSent(params: {
  orgId: string;
  quoteId: string;
  channel: string;
  receiver: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'quote.sent',
    aggregateType: 'quote',
    aggregateId: params.quoteId,
    payload: {
      channel: params.channel,
      receiver: params.receiver,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}
