import api from '../utils/api';
import { AiApprovalRequest } from '../types';

export const approvalApi = {
  list: async (params?: { status?: string }): Promise<AiApprovalRequest[]> => {
    return api.get('/art/approvals', { params });
  },

  listPending: async (): Promise<AiApprovalRequest[]> => {
    return api.get('/art/approvals', { params: { status: 'pending' } });
  },

  approve: async (id: string): Promise<AiApprovalRequest> => {
    return api.post(`/art/approvals/${id}/approve`);
  },

  reject: async (id: string, reason?: string): Promise<AiApprovalRequest> => {
    return api.post(`/art/approvals/${id}/reject`, { reason });
  },
};
