import api from "../utils/api";
import {
  Quote,
  QuoteStatus,
  CreateQuoteDto,
  UpdateQuoteDto,
  PaginatedResponse,
} from "../types";

export const quoteApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: QuoteStatus;
    customerId?: string;
    opportunityId?: string;
  }): Promise<PaginatedResponse<Quote>> => {
    return api.get("/quotes", { params });
  },

  get: async (id: string): Promise<{
    quote: Quote;
    versions: Array<{ versionNo: number; totalAmount: number; createdAt: string }>;
    approvals: Array<{ id: string; status: string; comment: string | null; createdAt: string }>;
  }> => {
    return api.get(`/quotes/${id}`);
  },

  create: async (data: CreateQuoteDto): Promise<Quote> => {
    return api.post("/quotes", data);
  },

  update: async (
    id: string,
    data: UpdateQuoteDto,
  ): Promise<Quote> => {
    return api.put(`/quotes/${id}`, data);
  },

  submitApproval: async (
    id: string,
    data: { approverIds: string[]; comment?: string; version: number },
  ): Promise<Quote> => {
    return api.post(`/quotes/${id}/submit-approval`, data);
  },

  approve: async (
    id: string,
    data: { action: "approved" | "rejected"; comment?: string },
  ): Promise<Quote> => {
    return api.post(`/quotes/${id}/approve`, data);
  },

  send: async (
    id: string,
    data: { channel: string; receiver: string; message?: string; version: number },
  ): Promise<Quote> => {
    return api.post(`/quotes/${id}/send`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/quotes/${id}`);
  },
};
