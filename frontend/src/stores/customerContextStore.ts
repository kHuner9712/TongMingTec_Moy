import { create } from 'zustand';
import { aiRuntimeApi } from '../services/ai-runtime';
import { customerMemoryApi } from '../services/customer-memory';
import { CustomerContext, CustomerIntent, CustomerRisk, CustomerNextAction, CustomerTimelineEvent } from '../types';

interface CustomerContextState {
  context: CustomerContext | null;
  intent: CustomerIntent | null;
  risk: CustomerRisk | null;
  nextActions: CustomerNextAction[];
  timeline: CustomerTimelineEvent[];
  aiRuns: any[];
  loading: boolean;
  loadCustomerContext: (customerId: string) => Promise<void>;
}

export const useCustomerContextStore = create<CustomerContextState>((set) => ({
  context: null,
  intent: null,
  risk: null,
  nextActions: [],
  timeline: [],
  aiRuns: [],
  loading: false,

  loadCustomerContext: async (customerId) => {
    set({ loading: true });
    try {
      const [contextRes, intentRes, riskRes, actionsRes, timelineRes, runsRes] = await Promise.all([
        customerMemoryApi.getContext(customerId).catch(() => null),
        customerMemoryApi.getIntent(customerId).catch(() => null),
        customerMemoryApi.getRisk(customerId).catch(() => null),
        aiRuntimeApi.getNextActions(customerId).catch(() => []),
        aiRuntimeApi.getCustomerTimeline(customerId).catch(() => []),
        aiRuntimeApi.listAgentRuns({ customerId }).catch(() => []),
      ]);

      set({
        context: contextRes as CustomerContext | null,
        intent: intentRes as CustomerIntent | null,
        risk: riskRes as CustomerRisk | null,
        nextActions: (actionsRes as any)?.items || actionsRes || [],
        timeline: (timelineRes as any)?.items || timelineRes || [],
        aiRuns: (runsRes as any)?.items || runsRes || [],
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
