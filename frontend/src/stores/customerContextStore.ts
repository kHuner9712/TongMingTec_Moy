import { create } from "zustand";
import { aiRuntimeApi } from "../services/ai-runtime";
import { customerMemoryApi } from "../services/customer-memory";
import {
  CustomerContext,
  CustomerIntent,
  CustomerRisk,
  CustomerNextAction,
  CustomerTimelineEvent,
  AiAgentRun,
  CustomerStateSnapshot,
} from "../types";

interface CustomerContextState {
  context: CustomerContext | null;
  intent: CustomerIntent | null;
  risk: CustomerRisk | null;
  nextActions: CustomerNextAction[];
  timeline: CustomerTimelineEvent[];
  aiRuns: AiAgentRun[];
  snapshots: CustomerStateSnapshot[];
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
  snapshots: [],
  loading: false,

  loadCustomerContext: async (customerId) => {
    set({ loading: true });
    try {
      const [
        contextRes,
        intentRes,
        riskRes,
        actionsRes,
        timelineRes,
        runsRes,
        snapsRes,
      ] = await Promise.all([
        customerMemoryApi.getContext(customerId).catch(() => null),
        customerMemoryApi.getIntent(customerId).catch(() => null),
        customerMemoryApi.getRisk(customerId).catch(() => null),
        aiRuntimeApi
          .getNextActions<CustomerNextAction[]>(customerId)
          .catch(() => []),
        aiRuntimeApi
          .getCustomerTimeline<CustomerTimelineEvent[]>(customerId)
          .catch(() => []),
        aiRuntimeApi
          .listAgentRuns<AiAgentRun[]>({ customerId })
          .catch(() => []),
        aiRuntimeApi
          .getCustomerSnapshots<CustomerStateSnapshot[]>(customerId)
          .catch(() => []),
      ]);

      set({
        context: contextRes as CustomerContext | null,
        intent: intentRes as CustomerIntent | null,
        risk: riskRes as CustomerRisk | null,
        nextActions: Array.isArray(actionsRes) ? actionsRes : [],
        timeline: Array.isArray(timelineRes) ? timelineRes : [],
        aiRuns: Array.isArray(runsRes) ? runsRes : [],
        snapshots: Array.isArray(snapsRes) ? snapsRes : [],
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
