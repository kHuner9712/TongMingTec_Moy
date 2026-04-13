import api from "../utils/api";
import {
  KnowledgeCategory,
  KnowledgeItem,
  CreateKnowledgeCategoryDto,
  UpdateKnowledgeCategoryDto,
  CreateKnowledgeItemDto,
  UpdateKnowledgeItemDto,
  ReviewKnowledgeItemDto,
  KnowledgeItemStatus,
  PaginatedResponse,
} from "../types";

export const knowledgeApi = {
  listCategories: async (params?: {
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<KnowledgeCategory>> => {
    return api.get("/knowledge/categories", { params });
  },

  getCategory: async (id: string): Promise<KnowledgeCategory> => {
    return api.get(`/knowledge/categories/${id}`);
  },

  createCategory: async (data: CreateKnowledgeCategoryDto): Promise<KnowledgeCategory> => {
    return api.post("/knowledge/categories", data);
  },

  updateCategory: async (id: string, data: UpdateKnowledgeCategoryDto): Promise<KnowledgeCategory> => {
    return api.put(`/knowledge/categories/${id}`, data);
  },

  deleteCategory: async (id: string): Promise<void> => {
    return api.delete(`/knowledge/categories/${id}`);
  },

  listItems: async (params?: {
    page?: number;
    page_size?: number;
    keyword?: string;
    categoryId?: string;
    status?: KnowledgeItemStatus;
  }): Promise<PaginatedResponse<KnowledgeItem>> => {
    return api.get("/knowledge/items", { params });
  },

  getItem: async (id: string): Promise<KnowledgeItem> => {
    return api.get(`/knowledge/items/${id}`);
  },

  createItem: async (data: CreateKnowledgeItemDto): Promise<KnowledgeItem> => {
    return api.post("/knowledge/items", data);
  },

  updateItem: async (id: string, data: UpdateKnowledgeItemDto): Promise<KnowledgeItem> => {
    return api.put(`/knowledge/items/${id}`, data);
  },

  submitForReview: async (id: string): Promise<KnowledgeItem> => {
    return api.post(`/knowledge/items/${id}/submit`);
  },

  reviewItem: async (id: string, data: ReviewKnowledgeItemDto): Promise<KnowledgeItem> => {
    return api.post(`/knowledge/items/${id}/review`, data);
  },

  search: async (params: {
    q: string;
    categoryId?: string;
    page?: number;
    page_size?: number;
  }): Promise<PaginatedResponse<KnowledgeItem>> => {
    return api.get("/knowledge/search", { params });
  },

  deleteItem: async (id: string): Promise<void> => {
    return api.delete(`/knowledge/items/${id}`);
  },
};
