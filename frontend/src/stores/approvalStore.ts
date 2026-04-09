import { create } from "zustand";
import { aiRuntimeApi } from "../services/ai-runtime";
import { AiApprovalRequest } from "../types";

interface ApprovalState {
  pendingApprovals: AiApprovalRequest[];
  currentApproval: AiApprovalRequest | null;
  fetchPending: () => Promise<void>;
  approve: (id: string) => Promise<void>;
  reject: (id: string, reason?: string) => Promise<void>;
  setCurrentApproval: (approval: AiApprovalRequest | null) => void;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  pendingApprovals: [],
  currentApproval: null,

  fetchPending: async () => {
    try {
      const data =
        await aiRuntimeApi.getPendingApprovals<AiApprovalRequest[]>();
      set({ pendingApprovals: Array.isArray(data) ? data : [] });
    } catch (_e) {
      // 获取待审批列表失败
    }
  },

  approve: async (id) => {
    try {
      await aiRuntimeApi.approveRequest(id);
      set({
        pendingApprovals: get().pendingApprovals.filter((a) => a.id !== id),
        currentApproval: null,
      });
    } catch (_e) {
      // 审批通过失败
    }
  },

  reject: async (id, reason) => {
    try {
      await aiRuntimeApi.rejectRequest(id, reason);
      set({
        pendingApprovals: get().pendingApprovals.filter((a) => a.id !== id),
        currentApproval: null,
      });
    } catch (_e) {
      // 审批拒绝失败
    }
  },

  setCurrentApproval: (approval) => set({ currentApproval: approval }),
}));
