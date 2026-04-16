import api from '../utils/api';
import { PaginatedResponse } from '../types';

export interface AutomationTrigger {
  id: string;
  orgId: string;
  name: string;
  eventType: string;
  actionType: string;
  condition: Record<string, unknown>;
  actionPayload: Record<string, unknown>;
  status: 'active' | 'paused' | 'archived';
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
  status: 'draft' | 'active' | 'paused' | 'archived';
  definition: Record<string, unknown>[];
  executionCount: number;
  failureCount: number;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export type AutomationRunStatus =
  | 'pending'
  | 'running'
  | 'awaiting_approval'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface AutomationRun {
  id: string;
  orgId: string;
  flowId: string;
  status: AutomationRunStatus;
  triggerPayload: Record<string, unknown>;
  triggerEventType: string | null;
  triggerConditionSnapshot: Record<string, unknown>;
  triggeredByType: string;
  triggeredById: string | null;
  businessContext: Record<string, unknown>;
  approvalState: string | null;
  manualIntervention: Record<string, unknown> | null;
  currentStepCode: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: string;
}

export interface AutomationStep {
  id: string;
  orgId: string;
  runId: string;
  stepCode: string;
  stepType: string;
  status:
    | 'pending'
    | 'running'
    | 'awaiting_approval'
    | 'completed'
    | 'failed'
    | 'skipped';
  inputPayload: Record<string, unknown>;
  outputPayload: Record<string, unknown> | null;
  approvalRequestId: string | null;
  requiresApproval: boolean;
  businessContext: Record<string, unknown>;
  errorMessage: string | null;
  createdAt: string;
}

export interface AutomationTemplate {
  code: string;
  name: string;
  description: string;
  category: 'contract' | 'delivery' | 'sales' | 'service';
  triggerEventType: string;
  triggerCondition?: Record<string, unknown>;
  recommended: boolean;
  steps: Array<{
    code: string;
    actionType: string;
    payload?: Record<string, unknown>;
    requiresApproval?: boolean;
    riskLevel?: string;
  }>;
  installed: boolean;
  flowId: string | null;
  flowStatus: string | null;
}

export const automationApi = {
  listTriggers: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    eventType?: string;
  }): Promise<PaginatedResponse<AutomationTrigger>> => {
    return api.get('/automation/triggers', {
      params,
    }) as Promise<PaginatedResponse<AutomationTrigger>>;
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
    return api.post('/automation/triggers', data);
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
    },
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
    return api.get('/automation/flows', {
      params,
    }) as Promise<PaginatedResponse<AutomationFlow>>;
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
    return api.post('/automation/flows', data);
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
    },
  ): Promise<AutomationFlow> => {
    return api.put(`/automation/flows/${id}`, data);
  },

  deleteFlow: async (id: string): Promise<void> => {
    return api.delete(`/automation/flows/${id}`);
  },

  executeFlow: async (
    id: string,
    payload?: Record<string, unknown>,
  ): Promise<AutomationRun> => {
    return api.post(`/automation/flows/${id}/execute`, { payload });
  },

  listFlowRuns: async (
    flowId: string,
    params?: { page?: number; page_size?: number },
  ): Promise<{ items: AutomationRun[]; total: number }> => {
    return api.get(`/automation/flows/${flowId}/runs`, { params });
  },

  listRuns: async (params?: {
    flow_id?: string;
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<AutomationRun>> => {
    return api.get('/automation/runs', {
      params,
    }) as Promise<PaginatedResponse<AutomationRun>>;
  },

  getRunSteps: async (runId: string): Promise<AutomationStep[]> => {
    return api.get(`/automation/runs/${runId}/steps`);
  },

  takeoverRun: async (runId: string, reason?: string): Promise<AutomationRun> => {
    return api.post(`/automation/runs/${runId}/takeover`, { reason });
  },

  confirmRun: async (runId: string, note?: string): Promise<AutomationRun> => {
    return api.post(`/automation/runs/${runId}/confirm`, { note });
  },

  listTemplates: async (): Promise<AutomationTemplate[]> => {
    return api.get('/automation/templates');
  },

  installTemplate: async (code: string): Promise<AutomationFlow> => {
    return api.post(`/automation/templates/${code}/install`);
  },
};
