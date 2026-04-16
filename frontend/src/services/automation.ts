import api from "../utils/api";
import { PaginatedResponse } from "../types";

export interface AutomationTrigger {
  id: string;
  orgId: string;
  name: string;
  eventType: string;
  actionType: string;
  condition: Record<string, unknown>;
  actionPayload: Record<string, unknown>;
  status: "active" | "paused" | "archived";
  executionCount: number;
  failureCount: number;
  lastExecutedAt: string | null;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationFlow {
  id: string;
  orgId: string;
  code: string;
  name: string;
  triggerType: string;
  triggerEventType: string | null;
  triggerCondition: Record<string, unknown>;
  status: "draft" | "active" | "paused" | "archived";
  definition: Record<string, unknown>[];
  executionCount: number;
  failureCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export const automationApi = {
  listTriggers: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    eventType?: string;
  }): Promise<PaginatedResponse<AutomationTrigger>> => {
    return api.get("/automation/triggers", { params }) as Promise<PaginatedResponse<AutomationTrigger>>;
  },

  getTrigger: async (id: string): Promise<AutomationTrigger> => {
    return api.get(`/automation/triggers/${id}`);
  },

  createTrigger: async (data: {
    name: string;
    eventType: string;
    actionType: string;
    condition?: Record<string, unknown>;
    actionPayload?: Record<string, unknown>;
  }): Promise<AutomationTrigger> => {
    return api.post("/automation/triggers", data);
  },

  updateTrigger: async (
    id: string,
    data: {
      name?: string;
      eventType?: string;
      actionType?: string;
      condition?: Record<string, unknown>;
      actionPayload?: Record<string, unknown>;
      status?: string;
      version: number;
    }
  ): Promise<AutomationTrigger> => {
    return api.put(`/automation/triggers/${id}`, data);
  },

  deleteTrigger: async (id: string): Promise<void> => {
    return api.delete(`/automation/triggers/${id}`);
  },

  listFlows: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    triggerType?: string;
  }): Promise<PaginatedResponse<AutomationFlow>> => {
    return api.get("/automation/flows", { params }) as Promise<PaginatedResponse<AutomationFlow>>;
  },

  getFlow: async (id: string): Promise<AutomationFlow> => {
    return api.get(`/automation/flows/${id}`);
  },

  createFlow: async (data: {
    code: string;
    name: string;
    triggerType: string;
    triggerEventType?: string;
    triggerCondition?: Record<string, unknown>;
    definition?: Record<string, unknown>[];
  }): Promise<AutomationFlow> => {
    return api.post("/automation/flows", data);
  },

  updateFlow: async (
    id: string,
    data: {
      name?: string;
      triggerType?: string;
      triggerEventType?: string;
      triggerCondition?: Record<string, unknown>;
      definition?: Record<string, unknown>[];
      status?: string;
      version: number;
    }
  ): Promise<AutomationFlow> => {
    return api.put(`/automation/flows/${id}`, data);
  },

  deleteFlow: async (id: string): Promise<void> => {
    return api.delete(`/automation/flows/${id}`);
  },

  executeFlow: async (
    id: string,
    payload?: Record<string, unknown>
  ): Promise<any> => {
    return api.post(`/automation/flows/${id}/execute`, { payload });
  },
};
