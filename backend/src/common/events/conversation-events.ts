import { DomainEvent } from './domain-event';

export function conversationCreated(params: {
  orgId: string;
  conversationId: string;
  channel: string;
  customerId?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'conversation.created',
    aggregateType: 'conversation',
    aggregateId: params.conversationId,
    payload: {
      channel: params.channel,
      customerId: params.customerId,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function conversationMessageCreated(params: {
  orgId: string;
  conversationId: string;
  messageId: string;
  senderType: string;
  senderId: string;
  contentType: string;
}): DomainEvent {
  return {
    eventType: 'conversation.message_created',
    aggregateType: 'conversation',
    aggregateId: params.conversationId,
    payload: {
      messageId: params.messageId,
      senderType: params.senderType,
      senderId: params.senderId,
      contentType: params.contentType,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}
