import api from '../utils/api';
import { AiAgent, AiAgentRun } from '../types';

export const agentApi = {
  list: async (params?: { status?: string; agentType?: string }): Promise<AiAgent[]> => {
    return api.get('/art/agents', { params });
  },

  get: async (id: string): Promise<AiAgent> => {
    return api.get(`/art/agents/${id}`);
  },

  register: async (data: Partial<AiAgent>): Promise<AiAgent> => {
    return api.post('/art/agents', data);
  },

  manageStatus: async (id: string, action: 'activate' | 'pause' | 'archive'): Promise<AiAgent> => {
    return api.patch(`/art/agents/${id}/status`, { action });
  },

  execute: async (code: string, input: Record<string, unknown>): Promise<AiAgentRun> => {
    return api.post(`/art/agents/${code}/execute`, { input });
  },

  listRuns: async (params?: { agentId?: string; status?: string }): Promise<AiAgentRun[]> => {
    return api.get('/art/agent-runs', { params });
  },

  getRun: async (id: string): Promise<AiAgentRun> => {
    return api.get(`/art/agent-runs/${id}`);
  },
};
