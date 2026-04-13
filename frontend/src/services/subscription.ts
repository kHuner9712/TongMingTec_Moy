import api from "../utils/api";
import {
  Subscription,
  SubscriptionStatus,
  CreateSubscriptionDto,
  PaginatedResponse,
} from "../types";

export const subscriptionApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: SubscriptionStatus;
    customerId?: string;
  }): Promise<PaginatedResponse<Subscription>> => {
    return api.get("/subscriptions", { params });
  },

  get: async (id: string): Promise<{
    subscription: Subscription;
    seats: any[];
  }> => {
    return api.get(`/subscriptions/${id}`);
  },

  create: async (data: CreateSubscriptionDto): Promise<Subscription> => {
    return api.post("/subscriptions", data);
  },

  update: async (
    id: string,
    data: {
      seatCount?: number;
      autoRenew?: boolean;
      endsAt?: string;
      version: number;
    },
  ): Promise<Subscription> => {
    return api.put(`/subscriptions/${id}`, data);
  },

  suspend: async (
    id: string,
    reason: string,
    version: number,
  ): Promise<Subscription> => {
    return api.post(`/subscriptions/${id}/suspend`, { reason, version });
  },

  cancel: async (
    id: string,
    reason?: string,
  ): Promise<Subscription> => {
    return api.post(`/subscriptions/${id}/cancel`, { reason });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/subscriptions/${id}`);
  },
};
