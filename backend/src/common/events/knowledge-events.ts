import { DomainEvent } from './domain-event';

export function knowledgeItemStatusChanged(params: {
  orgId: string;
  itemId: string;
  fromStatus: string;
  toStatus: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'knowledge_item.status_changed',
    aggregateType: 'knowledge_item',
    aggregateId: params.itemId,
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
