import { create } from 'zustand';
import { aiRuntimeApi } from '../services/ai-runtime';
import { customerApi } from '../services/customer';
import { WorkbenchAiInsight, AiAgentRun } from '../types';

interface KeyMetrics {
  totalCustomers: number;
  activeCustomers: number;
  pendingFollowups: number;
}

interface CockpitState {
  aiInsights: WorkbenchAiInsight[];
  riskSignals: WorkbenchAiInsight[];
  keyMetrics: KeyMetrics;
  recentAgentRuns: AiAgentRun[];
  loading: boolean;
  fetchCockpitData: () => Promise<void>;
}

export const useCockpitStore = create<CockpitState>((set) => ({
  aiInsights: [],
  riskSignals: [],
  keyMetrics: { totalCustomers: 0, activeCustomers: 0, pendingFollowups: 0 },
  recentAgentRuns: [],
  loading: false,

  fetchCockpitData: async () => {
    set({ loading: true });
    try {
      const [customersRes, runsRes] = await Promise.all([
        customerApi.list().catch(() => ({ items: [], total: 0 })),
        aiRuntimeApi.listAgentRuns().catch(() => []),
      ]);

      const customers = (customersRes as any)?.items || [];
      const totalCustomers = (customersRes as any)?.total || customers.length;
      const activeCustomers = customers.filter((c: any) => c.status === 'active').length;

      const runs = (runsRes as any)?.items || runsRes || [];

      set({
        keyMetrics: { totalCustomers, activeCustomers, pendingFollowups: 0 },
        recentAgentRuns: runs,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
