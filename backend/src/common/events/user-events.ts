import { DomainEvent } from './domain-event';

export function userCreated(params: {
  orgId: string;
  userId: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'user.created',
    aggregateType: 'user',
    aggregateId: params.userId,
    payload: {
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function userStatusChanged(params: {
  orgId: string;
  userId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'user.status_changed',
    aggregateType: 'user',
    aggregateId: params.userId,
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
