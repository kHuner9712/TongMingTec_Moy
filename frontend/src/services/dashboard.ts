import api from '../utils/api';

function unwrap<T>(response: any): T {
  if (response && response.code === 'OK' && response.data !== undefined) {
    return response.data as T;
  }
  return response as T;
}

export interface SalesDashboardData {
  kpi: {
    totalOpportunities: number;
    wonOpportunities: number;
    winRate: number;
    totalLeads: number;
    convertedLeads: number;
    leadConvertRate: number;
    totalRevenue: number;
  };
  pipeline: {
    total: number;
    byStage: Record<string, number>;
    byResult: Record<string, number>;
    recent: any[];
  };
  revenueTrend: { month: string; revenue: number }[];
  topOpportunities: any[];
}

export interface ServiceDashboardData {
  kpi: {
    totalConversations: number;
    queuedConversations: number;
    totalTickets: number;
    openTickets: number;
    resolvedTickets: number;
    resolveRate: number;
  };
  ticketByPriority: { priority: string; count: number }[];
  ticketByStatus: { status: string; count: number }[];
  healthDistribution: {
    total: number;
    distribution: Record<string, number>;
    averageScore: number;
  };
}

export interface ExecutiveDashboardData {
  customerMetrics: {
    total: number;
    active: number;
    critical: number;
    highRisk: number;
  };
  opportunityMetrics: {
    total: number;
    won: number;
    winRate: number;
  };
  dealMetrics: {
    activeContracts: number;
    activeOrders: number;
    activeSubscriptions: number;
    totalRevenue: number;
  };
  healthMetrics: {
    total: number;
    high: number;
    medium: number;
    low: number;
    critical: number;
  };
  subscriptionMetrics: {
    activeSubscriptions: number;
    recurringRevenue: number;
  };
  pipeline: any;
  revenueTrend: { month: string; revenue: number }[];
  healthDistribution: any;
  riskAlerts: {
    criticalCustomers: number;
    highRiskCustomers: number;
    lowHealthCount: number;
  };
}

export const dashboardApi = {
  getSummary: async (): Promise<any> => {
    const res = await api.get('/dashboard/summary');
    return unwrap(res);
  },

  getSalesDashboard: async (months: number = 6): Promise<SalesDashboardData> => {
    const res = await api.get('/dashboard/sales', { params: { months } });
    return unwrap(res);
  },

  getServiceDashboard: async (): Promise<ServiceDashboardData> => {
    const res = await api.get('/dashboard/service');
    return unwrap(res);
  },

  getExecutiveDashboard: async (): Promise<ExecutiveDashboardData> => {
    const res = await api.get('/dashboard/executive');
    return unwrap(res);
  },

  getMetrics: async (metricKey: string, startDate: string, endDate: string): Promise<any[]> => {
    const res = await api.get('/dashboard/metrics', {
      params: { metricKey, startDate, endDate },
    });
    return unwrap(res);
  },

  recordMetric: async (data: {
    metricKey: string;
    metricType: string;
    value: number;
    dimensions?: Record<string, unknown>;
  }): Promise<any> => {
    const res = await api.post('/dashboard/metrics', data);
    return unwrap(res);
  },
};
