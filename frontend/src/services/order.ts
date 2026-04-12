import api from "../utils/api";
import {
  Order,
  OrderItem,
  OrderStatus,
  CreateOrderDto,
  PaginatedResponse,
} from "../types";

export const orderApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: OrderStatus;
    customerId?: string;
    orderType?: string;
  }): Promise<PaginatedResponse<Order>> => {
    return api.get("/orders", { params });
  },

  get: async (id: string): Promise<{
    order: Order;
    items: OrderItem[];
  }> => {
    return api.get(`/orders/${id}`);
  },

  create: async (data: CreateOrderDto): Promise<Order> => {
    return api.post("/orders", data);
  },

  createFromContract: async (data: {
    contractId: string;
    quoteId?: string;
    customerId: string;
  }): Promise<Order> => {
    return api.post("/orders/from-contract", data);
  },

  confirm: async (id: string): Promise<Order> => {
    return api.post(`/orders/${id}/confirm`);
  },

  activate: async (id: string): Promise<Order> => {
    return api.post(`/orders/${id}/activate`);
  },

  complete: async (id: string): Promise<Order> => {
    return api.post(`/orders/${id}/complete`);
  },

  cancel: async (id: string, reason?: string): Promise<Order> => {
    return api.post(`/orders/${id}/cancel`, { reason });
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/orders/${id}`);
  },
};
