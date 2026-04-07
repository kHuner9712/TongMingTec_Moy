import api from "../utils/api";
import {
  Opportunity,
  OpportunityStage,
  OpportunityStageHistory,
  OpportunityResult,
  CreateOpportunityDto,
  PaginatedResponse,
} from "../types";

export interface OpportunitySummary {
  total: number;
  totalAmount: number;
  byStage: Record<OpportunityStage, number>;
  byResult: { won: number; lost: number };
}
export const opportunityApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    stage?: OpportunityStage;
    result?: OpportunityResult;
  }): Promise<PaginatedResponse<Opportunity>> => {
    return api.get("/opportunities", { params });
  },

  get: async (id: string): Promise<Opportunity & { stageHistory: OpportunityStageHistory[] }> => {
    return api.get(`/opportunities/${id}`);
  },

  getSummary: async (): Promise<OpportunitySummary> => {
    return api.get("/opportunities/summary");
  },

  create: async (data: CreateOpportunityDto): Promise<Opportunity> => {
    return api.post("/opportunities", data);
  },

  update: async (
    id: string,
    data: { amount?: number; expectedCloseDate?: string; version: number },
  ): Promise<Opportunity> => {
    return api.put(`/opportunities/${id}`, data);
  },

  changeStage: async (
    id: string,
    toStage: OpportunityStage,
    reason?: string,
    version?: number,
  ): Promise<Opportunity> => {
    return api.post(`/opportunities/${id}/stage`, { toStage, reason, version });
  },

  markResult: async (
    id: string,
    result: OpportunityResult,
    reason?: string,
    version?: number,
  ): Promise<Opportunity> => {
    return api.post(`/opportunities/${id}/result`, { result, reason, version });
  },
};
