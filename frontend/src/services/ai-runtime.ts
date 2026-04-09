import api from "../utils/api";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function unwrap<T>(response: any): T {
  if (response && response.code === "OK" && response.data !== undefined) {
    return response.data as T;
  }
  return response as T;
}

export const aiRuntimeApi = {
  getCustomer360: async <T>(customerId: string): Promise<T> => {
    const res = await api.get(`/ai-runtime/customers/${customerId}/360`);
    return unwrap<T>(res);
  },

  getCustomerTimeline: async <T>(
    customerId: string,
    params?: {
      eventType?: string;
      actorType?: string;
      page?: number;
      pageSize?: number;
    },
  ): Promise<T> => {
    const res = await api.get(`/ai-runtime/customers/${customerId}/timeline`, {
      params,
    });
    return unwrap<T>(res);
  },

  getNextActions: async <T>(customerId: string): Promise<T> => {
    const res = await api.get(
      `/ai-runtime/customers/${customerId}/next-actions`,
    );
    return unwrap<T>(res);
  },

  getCustomerSnapshots: async <T>(
    customerId: string,
    params?: { page?: number; pageSize?: number },
  ): Promise<T> => {
    const res = await api.get(`/ai-runtime/customers/${customerId}/snapshots`, {
      params,
    });
    return unwrap<T>(res);
  },

  listAgentRuns: async <T>(params?: {
    agentId?: string;
    status?: string;
    customerId?: string;
  }): Promise<T> => {
    const res = await api.get("/ai-runtime/agent-runs", { params });
    return unwrap<T>(res);
  },

  getAgentRun: async <T>(id: string): Promise<T> => {
    const res = await api.get(`/ai-runtime/agent-runs/${id}`);
    return unwrap<T>(res);
  },

  executeAgent: async <T>(data: {
    agentCode: string;
    input: Record<string, unknown>;
    customerId?: string;
  }): Promise<T> => {
    const res = await api.post("/ai-runtime/agent-runs", data);
    return unwrap<T>(res);
  },

  getPendingApprovals: async <T>(): Promise<T> => {
    const res = await api.get("/ai-runtime/approvals/pending");
    return unwrap<T>(res);
  },

  approveRequest: async <T>(id: string): Promise<T> => {
    const res = await api.post(`/ai-runtime/approvals/${id}/approve`);
    return unwrap<T>(res);
  },

  rejectRequest: async <T>(id: string, reason?: string): Promise<T> => {
    const res = await api.post(`/ai-runtime/approvals/${id}/reject`, {
      reason,
    });
    return unwrap<T>(res);
  },

  executeTakeover: async <T>(data: {
    agentRunId: string;
    reason: string;
  }): Promise<T> => {
    const res = await api.post("/ai-runtime/takeovers", data);
    return unwrap<T>(res);
  },

  executeRollback: async <T>(data: { agentRunId: string }): Promise<T> => {
    const res = await api.post("/ai-runtime/rollbacks", data);
    return unwrap<T>(res);
  },

  getCockpitData: async <T>(): Promise<T> => {
    const res = await api.get("/ai-runtime/cockpit");
    return unwrap<T>(res);
  },
};
