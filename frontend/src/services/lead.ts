import api from "../utils/api";
import {
  Lead,
  LeadFollowUp,
  CreateLeadDto,
  PaginatedResponse,
  LeadStatus,
  Customer,
  Opportunity,
} from "../types";

export interface FollowUpDto {
  content: string;
  followType?: "call" | "wechat" | "email" | "meeting" | "manual";
  nextActionAt?: string;
  version: number;
}

export const leadApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: LeadStatus;
    source?: string;
  }): Promise<PaginatedResponse<Lead>> => {
    return api.get("/leads", { params });
  },

  get: async (id: string): Promise<Lead & { followUps: LeadFollowUp[] }> => {
    return api.get(`/leads/${id}`);
  },

  create: async (data: CreateLeadDto): Promise<Lead> => {
    return api.post("/leads", data);
  },

  assign: async (
    id: string,
    ownerUserId: string,
    version: number,
  ): Promise<Lead> => {
    return api.post(`/leads/${id}/assign`, { ownerUserId, version });
  },

  addFollowUp: async (id: string, data: FollowUpDto): Promise<LeadFollowUp> => {
    return api.post(`/leads/${id}/follow-ups`, data);
  },

  convert: async (
    id: string,
    version: number,
  ): Promise<{ customer: Customer; opportunity: Opportunity }> => {
    return api.post(`/leads/${id}/convert`, { version });
  },
};
