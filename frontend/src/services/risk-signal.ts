import api from '../utils/api';

export interface RiskSignal {
  id: string;
  type: 'risk' | 'opportunity' | 'renewal' | 'service';
  severity: 'info' | 'warning' | 'error';
  title: string;
  description: string;
  relatedType?: string;
  relatedId?: string;
  createdAt: string;
}

export const riskSignalApi = {
  list: async (params?: { type?: string; severity?: string }): Promise<RiskSignal[]> => {
    return api.get('/cmem/risk-signals', { params });
  },

  getStats: async (): Promise<{ risk: number; opportunity: number; renewal: number; service: number }> => {
    return api.get('/cmem/risk-signals/stats');
  },
};
