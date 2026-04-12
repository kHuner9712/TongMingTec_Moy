import api from "../utils/api";
import {
  Contract,
  ContractStatus,
  CreateContractDto,
  PaginatedResponse,
} from "../types";

export const contractApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: ContractStatus;
    customerId?: string;
    opportunityId?: string;
  }): Promise<PaginatedResponse<Contract>> => {
    return api.get("/contracts", { params });
  },

  get: async (id: string): Promise<{
    contract: Contract;
    approvals: Array<{ id: string; status: string; comment: string | null; createdAt: string }>;
    documents: Array<{ id: string; fileUrl: string; docType: string; signProvider: string | null; signStatus: string | null }>;
  }> => {
    return api.get(`/contracts/${id}`);
  },

  create: async (data: CreateContractDto): Promise<Contract> => {
    return api.post("/contracts", data);
  },

  createFromQuote: async (data: {
    quoteId: string;
    opportunityId: string;
    customerId: string;
  }): Promise<Contract> => {
    return api.post("/contracts/from-quote", data);
  },

  update: async (
    id: string,
    data: { startsOn?: string; endsOn?: string; version: number },
  ): Promise<Contract> => {
    return api.put(`/contracts/${id}`, data);
  },

  submitApproval: async (
    id: string,
    data: { approverIds: string[]; comment?: string; version: number },
  ): Promise<Contract> => {
    return api.post(`/contracts/${id}/submit-approval`, data);
  },

  approve: async (
    id: string,
    data: { action: "approved" | "rejected"; comment?: string },
  ): Promise<Contract> => {
    return api.post(`/contracts/${id}/approve`, data);
  },

  sign: async (
    id: string,
    data: { signProvider: string; version: number },
  ): Promise<Contract> => {
    return api.post(`/contracts/${id}/sign`, data);
  },

  activate: async (id: string): Promise<Contract> => {
    return api.post(`/contracts/${id}/activate`);
  },

  terminate: async (id: string, reason?: string): Promise<Contract> => {
    return api.post(`/contracts/${id}/terminate`, { reason });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/contracts/${id}`);
  },
};
