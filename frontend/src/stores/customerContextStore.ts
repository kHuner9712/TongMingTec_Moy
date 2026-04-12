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
  acceptAction: (customerId: string, actionId: string) => Promise<void>;
  dismissAction: (customerId: string, actionId: string) => Promise<void>;
}

function unwrapItems<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (
    value &&
    typeof value === "object" &&
    Array.isArray((value as { items?: unknown[] }).items)
  ) {
    return (value as { items: T[] }).items;
  }
  return [];
}

export const useCustomerContextStore = create<CustomerContextState>(
  (set, get) => ({
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
          nextActions: unwrapItems<CustomerNextAction>(actionsRes),
          timeline: unwrapItems<CustomerTimelineEvent>(timelineRes),
          aiRuns: unwrapItems<AiAgentRun>(runsRes),
          snapshots: unwrapItems<CustomerStateSnapshot>(snapsRes),
          loading: false,
        });
      } catch {
        set({ loading: false });
      }
    },

    acceptAction: async (customerId, actionId) => {
      await customerMemoryApi.acceptAction(customerId, actionId);
      set({
        nextActions: get().nextActions.map((a) =>
          a.id === actionId ? { ...a, status: "accepted" as const } : a,
        ),
      });
    },

    dismissAction: async (customerId, actionId) => {
      await customerMemoryApi.dismissAction(customerId, actionId);
      set({
        nextActions: get().nextActions.map((a) =>
          a.id === actionId ? { ...a, status: "dismissed" as const } : a,
        ),
      });
    },
  }),
);
