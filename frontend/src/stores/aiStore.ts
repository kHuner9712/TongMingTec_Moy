import { create } from 'zustand';
import { aiRuntimeApi } from '../services/ai-runtime';
import { AiAgentRun } from '../types';

interface AiState {
  agentList: any[];
  agentRuns: AiAgentRun[];
  currentAgentRun: AiAgentRun | null;
  copilotVisible: boolean;
  copilotContext: Record<string, unknown>;
  executeAgent: (code: string, input: Record<string, unknown>, customerId?: string) => Promise<AiAgentRun | null>;
  fetchAgentRuns: (filters?: { agentId?: string; status?: string; customerId?: string }) => Promise<void>;
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
      const result = await aiRuntimeApi.executeAgent({ agentCode: code, input, customerId });
      const run = result as any;
      set((state) => ({ agentRuns: [run, ...state.agentRuns], currentAgentRun: run }));
      return run;
    } catch {
      return null;
    }
  },

  fetchAgentRuns: async (filters) => {
    try {
      const result = await aiRuntimeApi.listAgentRuns(filters);
      set({ agentRuns: (result as any)?.items || result || [] });
    } catch {}
  },

  setCopilotVisible: (visible) => set({ copilotVisible: visible }),
  setCopilotContext: (context) => set({ copilotContext: context }),
}));
