import { create } from "zustand";
import { aiRuntimeApi } from "../services/ai-runtime";
import { WorkbenchAiInsight, AiAgentRun } from "../types";

interface KeyMetrics {
  totalCustomers: number;
  activeCustomers: number;
  pendingFollowups: number;
}

interface RecommendedTodo {
  id: string;
  title: string;
  description: string;
  actionType: string;
  relatedId?: string;
  relatedType?: string;
  priority: number;
}

interface CockpitDataResponse {
  aiInsights?: WorkbenchAiInsight[];
  riskSignals?: WorkbenchAiInsight[];
  keyMetrics?: KeyMetrics;
  recentAgentRuns?: AiAgentRun[];
  recommendedTodos?: RecommendedTodo[];
}

interface CockpitState {
  aiInsights: WorkbenchAiInsight[];
  riskSignals: WorkbenchAiInsight[];
  keyMetrics: KeyMetrics;
  recentAgentRuns: AiAgentRun[];
  recommendedTodos: RecommendedTodo[];
  loading: boolean;
  fetchCockpitData: () => Promise<void>;
}

export const useCockpitStore = create<CockpitState>((set) => ({
  aiInsights: [],
  riskSignals: [],
  keyMetrics: { totalCustomers: 0, activeCustomers: 0, pendingFollowups: 0 },
  recentAgentRuns: [],
  recommendedTodos: [],
  loading: false,

  fetchCockpitData: async () => {
    set({ loading: true });
    try {
      const data = await aiRuntimeApi.getCockpitData<CockpitDataResponse>();
      set({
        aiInsights: data.aiInsights || [],
        riskSignals: data.riskSignals || [],
        keyMetrics: data.keyMetrics || {
          totalCustomers: 0,
          activeCustomers: 0,
          pendingFollowups: 0,
        },
        recentAgentRuns: data.recentAgentRuns || [],
        recommendedTodos: data.recommendedTodos || [],
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
