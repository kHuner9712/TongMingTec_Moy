import { DomainEvent } from './domain-event';

export function taskCreated(params: {
  orgId: string;
  taskId: string;
  sourceType?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'task.created',
    aggregateType: 'task',
    aggregateId: params.taskId,
    payload: {
      sourceType: params.sourceType,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function taskStatusChanged(params: {
  orgId: string;
  taskId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'task.status_changed',
    aggregateType: 'task',
    aggregateId: params.taskId,
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
