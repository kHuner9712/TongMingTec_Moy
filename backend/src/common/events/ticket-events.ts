import { DomainEvent } from './domain-event';

export function ticketCreated(params: {
  orgId: string;
  ticketId: string;
  priority?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'ticket.created',
    aggregateType: 'ticket',
    aggregateId: params.ticketId,
    payload: {
      priority: params.priority,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function ticketStatusChanged(params: {
  orgId: string;
  ticketId: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'ticket.status_changed',
    aggregateType: 'ticket',
    aggregateId: params.ticketId,
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
