import api from "../utils/api";
import {
  CustomerHealthScore,
  SuccessPlan,
  CustomerReturnVisit,
  HealthLevel,
  SuccessPlanStatus,
  PaginatedResponse,
} from "../types";

export const csmApi = {
  listHealthScores: async (params?: {
    page?: number;
    page_size?: number;
    level?: HealthLevel;
    customerId?: string;
  }): Promise<PaginatedResponse<CustomerHealthScore>> => {
    return api.get("/csm/health", { params });
  },

  getHealthScore: async (customerId: string): Promise<CustomerHealthScore> => {
    return api.get(`/csm/health/${customerId}`);
  },

  evaluateHealth: async (customerId: string): Promise<CustomerHealthScore> => {
    return api.post("/csm/health/evaluate", { customerId });
  },

  listSuccessPlans: async (params?: {
    page?: number;
    page_size?: number;
    status?: SuccessPlanStatus;
    customerId?: string;
  }): Promise<PaginatedResponse<SuccessPlan>> => {
    return api.get("/csm/plans", { params });
  },

  getSuccessPlan: async (id: string): Promise<SuccessPlan> => {
    return api.get(`/csm/plans/${id}`);
  },

  createSuccessPlan: async (data: {
    customerId: string;
    title: string;
    ownerUserId: string;
    payload?: Record<string, unknown>;
  }): Promise<SuccessPlan> => {
    return api.post("/csm/plans", data);
  },

  updateSuccessPlan: async (
    id: string,
    data: {
      title?: string;
      status?: SuccessPlanStatus;
      payload?: Record<string, unknown>;
      version: number;
    },
  ): Promise<SuccessPlan> => {
    return api.put(`/csm/plans/${id}`, data);
  },

  createReturnVisit: async (data: {
    customerId: string;
    visitType: string;
    summary: string;
    nextVisitAt?: string;
  }): Promise<CustomerReturnVisit> => {
    return api.post("/csm/visits", data);
  },

  listReturnVisits: async (
    customerId: string,
    params?: { page?: number; page_size?: number },
  ): Promise<PaginatedResponse<CustomerReturnVisit>> => {
    return api.get(`/csm/visits/${customerId}`, { params });
  },
};
