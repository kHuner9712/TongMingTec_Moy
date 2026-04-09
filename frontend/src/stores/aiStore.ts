import { create } from "zustand";
import { aiRuntimeApi } from "../services/ai-runtime";
import { AiAgentRun } from "../types";

interface AiState {
  agentList: any[];
  agentRuns: AiAgentRun[];
  currentAgentRun: AiAgentRun | null;
  copilotVisible: boolean;
  copilotContext: Record<string, unknown>;
  executeAgent: (
    code: string,
    input: Record<string, unknown>,
    customerId?: string,
  ) => Promise<AiAgentRun | null>;
  fetchAgentRuns: (filters?: {
    agentId?: string;
    status?: string;
    customerId?: string;
  }) => Promise<void>;
  setCopilotVisible: (visible: boolean) => void;
  setCopilotContext: (context: Record<string, unknown>) => void;
}

export const useAiStore = create<AiState>((set) => ({
  agentList: [],
  agentRuns: [],
  currentAgentRun: null,
  copilotVisible: false,
  copilotContext: {},

  executeAgent: async (code, input, customerId) => {
    try {
      const run = await aiRuntimeApi.executeAgent<AiAgentRun>({
        agentCode: code,
        input,
        customerId,
      });
      set((state) => ({
        agentRuns: [run, ...state.agentRuns],
        currentAgentRun: run,
      }));
      return run;
    } catch {
      return null;
    }
  },

  fetchAgentRuns: async (filters) => {
    try {
      const data = await aiRuntimeApi.listAgentRuns<AiAgentRun[]>(filters);
      set({ agentRuns: Array.isArray(data) ? data : [] });
    } catch (_e) {
      // 获取 Agent 运行列表失败，保持空列表
    }
  },

  setCopilotVisible: (visible) => set({ copilotVisible: visible }),
  setCopilotContext: (context) => set({ copilotContext: context }),
}));
