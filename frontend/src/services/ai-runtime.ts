import api from '../utils/api';

export const aiRuntimeApi = {
  getCustomer360: async (customerId: string) => {
    return api.get(`/ai-runtime/customers/${customerId}/360`);
  },

  getCustomerTimeline: async (customerId: string, params?: { eventType?: string; actorType?: string; page?: number; pageSize?: number }) => {
    return api.get(`/ai-runtime/customers/${customerId}/timeline`, { params });
  },

  getNextActions: async (customerId: string) => {
    return api.get(`/ai-runtime/customers/${customerId}/next-actions`);
  },

  getCustomerSnapshots: async (customerId: string, params?: { page?: number; pageSize?: number }) => {
    return api.get(`/ai-runtime/customers/${customerId}/snapshots`, { params });
  },

  listAgentRuns: async (params?: { agentId?: string; status?: string; customerId?: string }) => {
    return api.get('/ai-runtime/agent-runs', { params });
  },

  getAgentRun: async (id: string) => {
    return api.get(`/ai-runtime/agent-runs/${id}`);
  },

  executeAgent: async (data: { agentCode: string; input: Record<string, unknown>; customerId?: string }) => {
    return api.post('/ai-runtime/agent-runs', data);
  },

  getPendingApprovals: async () => {
    return api.get('/ai-runtime/approvals/pending');
  },

  approveRequest: async (id: string) => {
    return api.post(`/ai-runtime/approvals/${id}/approve`);
  },

  rejectRequest: async (id: string, reason?: string) => {
    return api.post(`/ai-runtime/approvals/${id}/reject`, { reason });
  },

  executeTakeover: async (data: { agentRunId: string; reason: string }) => {
    return api.post('/ai-runtime/takeovers', data);
  },

  executeRollback: async (data: { agentRunId: string }) => {
    return api.post('/ai-runtime/rollbacks', data);
  },
};
