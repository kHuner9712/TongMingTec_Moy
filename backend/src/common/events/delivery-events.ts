import { DomainEvent } from './domain-event';

export function deliveryCreated(params: {
  orgId: string;
  deliveryId: string;
  customerId: string;
  orderId?: string | null;
  subscriptionId?: string | null;
  ownerUserId?: string | null;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'delivery.created',
    aggregateType: 'delivery',
    aggregateId: params.deliveryId,
    payload: {
      customerId: params.customerId,
      orderId: params.orderId || null,
      subscriptionId: params.subscriptionId || null,
      ownerUserId: params.ownerUserId || null,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function deliveryStatusChanged(params: {
  orgId: string;
  deliveryId: string;
  customerId: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'delivery.status_changed',
    aggregateType: 'delivery',
    aggregateId: params.deliveryId,
    payload: {
      customerId: params.customerId,
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

export function deliveryAcceptanceRecorded(params: {
  orgId: string;
  deliveryId: string;
  acceptanceId: string;
  result: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'delivery.acceptance_recorded',
    aggregateType: 'delivery',
    aggregateId: params.deliveryId,
    payload: {
      acceptanceId: params.acceptanceId,
      result: params.result,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function deliveryRiskReported(params: {
  orgId: string;
  deliveryId: string;
  riskId: string;
  severity: string;
  status: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'delivery.risk_reported',
    aggregateType: 'delivery',
    aggregateId: params.deliveryId,
    payload: {
      riskId: params.riskId,
      severity: params.severity,
      status: params.status,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function deliveryOutcomeUpdated(params: {
  orgId: string;
  deliveryId: string;
  outcomeId: string;
  status: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'delivery.outcome_updated',
    aggregateType: 'delivery',
    aggregateId: params.deliveryId,
    payload: {
      outcomeId: params.outcomeId,
      status: params.status,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}
