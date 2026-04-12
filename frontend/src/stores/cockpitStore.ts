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

function normalizeList<T>(value: unknown): T[] {
  if (Array.isArray(value)) {
    return value as T[];
  }
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { items?: unknown[] }).items)
  ) {
    return (value as { items: T[] }).items;
  }
  return [];
}

function normalizeKeyMetrics(value: unknown): KeyMetrics {
  if (!value || typeof value !== "object") {
    return { totalCustomers: 0, activeCustomers: 0, pendingFollowups: 0 };
  }
  const raw = value as Partial<KeyMetrics>;
  return {
    totalCustomers:
      typeof raw.totalCustomers === "number" ? raw.totalCustomers : 0,
    activeCustomers:
      typeof raw.activeCustomers === "number" ? raw.activeCustomers : 0,
    pendingFollowups:
      typeof raw.pendingFollowups === "number" ? raw.pendingFollowups : 0,
  };
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
        aiInsights: normalizeList<WorkbenchAiInsight>(data.aiInsights),
        riskSignals: normalizeList<WorkbenchAiInsight>(data.riskSignals),
        keyMetrics: normalizeKeyMetrics(data.keyMetrics),
        recentAgentRuns: normalizeList<AiAgentRun>(data.recentAgentRuns),
        recommendedTodos: normalizeList<RecommendedTodo>(data.recommendedTodos),
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
