import api from "../utils/api";
import {
  Payment,
  PaymentStatus,
  CreatePaymentDto,
  PaginatedResponse,
} from "../types";

export const paymentApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: PaymentStatus;
    orderId?: string;
    customerId?: string;
  }): Promise<PaginatedResponse<Payment>> => {
    return api.get("/payments", { params });
  },

  get: async (id: string): Promise<Payment> => {
    return api.get(`/payments/${id}`);
  },

  create: async (data: CreatePaymentDto): Promise<Payment> => {
    return api.post("/payments", data);
  },

  process: async (id: string): Promise<Payment> => {
    return api.post(`/payments/${id}/process`);
  },

  succeed: async (id: string, externalTxnId?: string): Promise<Payment> => {
    return api.post(`/payments/${id}/succeed`, { externalTxnId });
  },

  fail: async (id: string): Promise<Payment> => {
    return api.post(`/payments/${id}/fail`);
  },

  refund: async (id: string): Promise<Payment> => {
    return api.post(`/payments/${id}/refund`);
  },

  void: async (id: string): Promise<Payment> => {
    return api.post(`/payments/${id}/void`);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/payments/${id}`);
  },
};
