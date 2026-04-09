import api from "../utils/api";
import {
  CustomerContext,
  CustomerIntent,
  CustomerRisk,
  CustomerNextAction,
} from "../types";

export const customerMemoryApi = {
  getContext: async (customerId: string): Promise<CustomerContext[]> => {
    return api.get(`/cmem/customers/${customerId}/context`);
  },

  getIntent: async (customerId: string): Promise<CustomerIntent | null> => {
    return api.get(`/cmem/customers/${customerId}/intent`);
  },

  getRisk: async (customerId: string): Promise<CustomerRisk | null> => {
    return api.get(`/cmem/customers/${customerId}/risk`);
  },

  listRisks: async (params?: {
    riskLevel?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ items?: CustomerRisk[]; [key: string]: unknown }> => {
    return api.get("/cmem/risks", { params });
  },

  getNextActions: async (
    customerId: string,
    params?: { status?: string },
  ): Promise<{ items?: CustomerNextAction[]; [key: string]: unknown }> => {
    return api.get(`/cmem/customers/${customerId}/next-actions`, { params });
  },

  acceptAction: async (
    customerId: string,
    actionId: string,
  ): Promise<CustomerNextAction> => {
    return api.post(
      `/cmem/customers/${customerId}/next-actions/${actionId}/accept`,
    );
  },

  dismissAction: async (
    customerId: string,
    actionId: string,
  ): Promise<CustomerNextAction> => {
    return api.post(
      `/cmem/customers/${customerId}/next-actions/${actionId}/dismiss`,
    );
  },
};
