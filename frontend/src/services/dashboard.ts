import api from '../utils/api';
import { DashboardSummary } from '../types';

export const dashboardApi = {
  getSummary: async (): Promise<DashboardSummary> => {
    return api.get('/system/summary');
  },
};
