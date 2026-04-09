import { DomainEvent } from './domain-event';

export function agentStatusChanged(params: {
  orgId: string;
  agentId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'agent.status_changed',
    aggregateType: 'ai_agent',
    aggregateId: params.agentId,
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
