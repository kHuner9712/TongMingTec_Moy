import { DomainEvent } from './domain-event';

export function leadCreated(params: {
  orgId: string;
  leadId: string;
  source: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'lead.created',
    aggregateType: 'lead',
    aggregateId: params.leadId,
    payload: {
      source: params.source,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function leadStatusChanged(params: {
  orgId: string;
  leadId: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'lead.status_changed',
    aggregateType: 'lead',
    aggregateId: params.leadId,
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
