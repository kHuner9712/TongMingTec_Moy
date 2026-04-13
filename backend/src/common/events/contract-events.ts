import { DomainEvent } from './domain-event';

export function contractStatusChanged(params: {
  orgId: string;
  contractId: string;
  fromStatus: string;
  toStatus: string;
  reason?: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'contract.status_changed',
    aggregateType: 'contract',
    aggregateId: params.contractId,
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

export function contractApprovalCreated(params: {
  orgId: string;
  contractId: string;
  approverIds: string[];
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'contract.approval_created',
    aggregateType: 'contract',
    aggregateId: params.contractId,
    payload: {
      approverIds: params.approverIds,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function contractSigned(params: {
  orgId: string;
  contractId: string;
  signProvider: string;
  actorType: string;
  actorId: string;
}): DomainEvent {
  return {
    eventType: 'contract.signed',
    aggregateType: 'contract',
    aggregateId: params.contractId,
    payload: {
      signProvider: params.signProvider,
      actorType: params.actorType,
      actorId: params.actorId,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

export function contractExpiryWarning(params: {
  orgId: string;
  contractId: string;
  contractNo: string;
  customerId: string;
  endsOn: string;
  daysUntilExpiry: number;
}): DomainEvent {
  return {
    eventType: 'contract.expiry_warning',
    aggregateType: 'contract',
    aggregateId: params.contractId,
    payload: {
      contractNo: params.contractNo,
      customerId: params.customerId,
      endsOn: params.endsOn,
      daysUntilExpiry: params.daysUntilExpiry,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}
