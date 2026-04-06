import api from "../utils/api";
import {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  PaginatedResponse,
  CustomerStatus,
} from "../types";

export const customerApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: CustomerStatus;
    keyword?: string;
  }): Promise<PaginatedResponse<Customer>> => {
    return api.get("/customers", { params });
  },

  get: async (id: string): Promise<Customer> => {
    return api.get(`/customers/${id}`);
  },

  create: async (data: CreateCustomerDto): Promise<Customer> => {
    return api.post("/customers", data);
  },

  update: async (id: string, data: UpdateCustomerDto): Promise<Customer> => {
    return api.put(`/customers/${id}`, data);
  },

  changeStatus: async (
    id: string,
    status: CustomerStatus,
    reason?: string,
    version?: number,
  ): Promise<Customer> => {
    return api.post(`/customers/${id}/status`, { status, reason, version });
  },
};
