import api from '../utils/api';

function unwrap<T>(response: unknown): T {
  if (
    response &&
    typeof response === 'object' &&
    'code' in response &&
    (response as { code?: string }).code === 'OK' &&
    'data' in response
  ) {
    return (response as { data: T }).data;
  }
  return response as T;
}

export type DashboardRange = '7d' | '30d' | '90d';
export type DashboardBoardType = 'executive' | 'sales' | 'service';
export type DashboardMetricStatus =
  | 'healthy'
  | 'warning'
  | 'critical'
  | 'insufficient_data';
export type DashboardMetricTrend = 'up' | 'down' | 'flat';
export type DashboardMetricPerformance = 'improved' | 'worsened' | 'stable';
export type DashboardDataQuality = 'ready' | 'proxy' | 'missing';

export interface DashboardActionSuggestion {
  code: string;
  title: string;
  description: string;
  ownerModule: string;
}

export interface DashboardMetricSource {
  modules: string[];
  tables: string[];
  fields: string[];
  formula: string;
  description: string;
  dataQuality: DashboardDataQuality;
  governanceNotes: string[];
}

export interface DashboardIndicator {
  key: string;
  name: string;
  unit: 'minutes' | 'hours' | 'percent';
  direction: 'higher_is_better' | 'lower_is_better';
  threshold: {
    warning: number;
    critical: number;
  };
  currentValue: number;
  previousValue: number;
  deltaValue: number;
  currentLabel: string;
  previousLabel: string;
  trend: DashboardMetricTrend;
  performance: DashboardMetricPerformance;
  status: DashboardMetricStatus;
  sampleSize: number;
  source: DashboardMetricSource;
  anomalyActions: DashboardActionSuggestion[];
}

export interface DashboardIndicatorGroup {
  key: string;
  name: string;
  description: string;
  metricKeys: string[];
}

export interface DashboardAnomaly {
  indicatorKey: string;
  indicatorName: string;
  status: DashboardMetricStatus;
  currentLabel: string;
  sampleSize: number;
  reason: string;
  suggestedActions: DashboardActionSuggestion[];
}

export interface DashboardModuleCoverage {
  module: string;
  covered: boolean;
  indicatorKeys: string[];
}

export interface DashboardBoardData {
  board: DashboardBoardType;
  orgId: string;
  range: DashboardRange;
  generatedAt: string;
  window: {
    current: { startAt: string; endAt: string; label: string };
    previous: { startAt: string; endAt: string; label: string };
  };
  indicators: DashboardIndicator[];
  groups: DashboardIndicatorGroup[];
  anomalies: DashboardAnomaly[];
  dataGovernance: {
    computable: string[];
    proxy: string[];
    missing: string[];
  };
  moduleCoverage: DashboardModuleCoverage[];
}

export const dashboardApi = {
  getSummary: async (range: DashboardRange = '30d'): Promise<DashboardBoardData> => {
    const res = await api.get('/dashboard/summary', { params: { range } });
    return unwrap<DashboardBoardData>(res);
  },

  getSalesDashboard: async (
    range: DashboardRange = '30d',
  ): Promise<DashboardBoardData> => {
    const res = await api.get('/dashboard/sales', { params: { range } });
    return unwrap<DashboardBoardData>(res);
  },

  getServiceDashboard: async (
    range: DashboardRange = '30d',
  ): Promise<DashboardBoardData> => {
    const res = await api.get('/dashboard/service', { params: { range } });
    return unwrap<DashboardBoardData>(res);
  },

  getExecutiveDashboard: async (
    range: DashboardRange = '30d',
  ): Promise<DashboardBoardData> => {
    const res = await api.get('/dashboard/executive', { params: { range } });
    return unwrap<DashboardBoardData>(res);
  },

  getMetrics: async (
    metricKey: string,
    startDate: string,
    endDate: string,
  ): Promise<unknown[]> => {
    const res = await api.get('/dashboard/metrics', {
      params: { metricKey, startDate, endDate },
    });
    return unwrap<unknown[]>(res);
  },

  recordMetric: async (data: {
    metricKey: string;
    metricType: string;
    value: number;
    dimensions?: Record<string, unknown>;
  }): Promise<unknown> => {
    const res = await api.post('/dashboard/metrics', data);
    return unwrap<unknown>(res);
  },
};
