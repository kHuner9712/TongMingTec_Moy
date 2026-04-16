import { DomainEvent } from './domain-event';

export function dashboardMetricAnomaly(params: {
  orgId: string;
  metricKey: string;
  metricName: string;
  currentValue: number;
  currentLabel: string;
  status: string;
  range: string;
  sampleSize: number;
  qualityCategory: 'actual' | 'proxy' | 'coverage_limited';
  dataQuality: 'ready' | 'proxy' | 'missing';
  ownerUserIds?: string[];
  suggestedActions?: string[];
  reason: string;
}): DomainEvent {
  const aggregateId = `${params.metricKey}:${params.range}`;

  return {
    eventType: 'dash.metric_anomaly',
    aggregateType: 'dashboard_metric',
    aggregateId,
    payload: {
      metricKey: params.metricKey,
      metricName: params.metricName,
      currentValue: params.currentValue,
      currentLabel: params.currentLabel,
      status: params.status,
      range: params.range,
      sampleSize: params.sampleSize,
      qualityCategory: params.qualityCategory,
      dataQuality: params.dataQuality,
      ownerUserIds: params.ownerUserIds || [],
      suggestedActions: params.suggestedActions || [],
      reason: params.reason,
    },
    occurredAt: new Date(),
    orgId: params.orgId,
  };
}

