import api from "../utils/api";
import { User, PaginatedResponse } from "../types";

export const userApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    keyword?: string;
  }): Promise<PaginatedResponse<User>> => {
    return api.get("/users", { params });
  },

  get: async (id: string): Promise<User> => {
    return api.get(`/users/${id}`);
  },
};
