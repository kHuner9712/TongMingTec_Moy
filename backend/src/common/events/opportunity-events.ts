import { DomainEvent } from './domain-event';

export function opportunityStageChanged(params: {
  orgId: string;
  opportunityId: string;
  fromStage: string;
  toStage: string;
  reason?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'opportunity.stage_changed',
    aggregateType: 'opportunity',
    aggregateId: params.opportunityId,
    payload: {
      fromStage: params.fromStage,
      toStage: params.toStage,
      reason: params.reason,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function opportunityResultSet(params: {
  orgId: string;
  opportunityId: string;
  result: 'won' | 'lost';
  reason?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'opportunity.result_set',
    aggregateType: 'opportunity',
    aggregateId: params.opportunityId,
    payload: {
      result: params.result,
      reason: params.reason,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}
