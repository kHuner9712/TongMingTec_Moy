import { create } from "zustand";
import { approvalApi } from "../services/approval";
import { AiApprovalRequest } from "../types";

interface ApprovalState {
  pendingApprovals: AiApprovalRequest[];
  approvedApprovals: AiApprovalRequest[];
  expiredApprovals: AiApprovalRequest[];
  currentApproval: AiApprovalRequest | null;
  fetchPending: () => Promise<void>;
  fetchApproved: () => Promise<void>;
  fetchExpired: () => Promise<void>;
  approve: (id: string) => Promise<void>;
  reject: (id: string, reason?: string) => Promise<void>;
  setCurrentApproval: (approval: AiApprovalRequest | null) => void;
}

export const useApprovalStore = create<ApprovalState>((set, get) => ({
  pendingApprovals: [],
  approvedApprovals: [],
  expiredApprovals: [],
  currentApproval: null,

  fetchPending: async () => {
    try {
      const data = await approvalApi.listPending();
      set({ pendingApprovals: Array.isArray(data) ? data : [] });
    } catch (_e) {
      // 获取待审批列表失败
    }
  },

  fetchApproved: async () => {
    try {
      const data = await approvalApi.list({ status: "approved" });
      set({ approvedApprovals: Array.isArray(data) ? data : [] });
    } catch (_e) {
      // 获取已审批列表失败
    }
  },

  fetchExpired: async () => {
    try {
      const data = await approvalApi.list({ status: "expired" });
      set({ expiredApprovals: Array.isArray(data) ? data : [] });
    } catch (_e) {
      // 获取已过期列表失败
    }
  },

  approve: async (id) => {
    try {
      await approvalApi.approve(id);
      set({
        pendingApprovals: get().pendingApprovals.filter((a) => a.id !== id),
        currentApproval: null,
      });
      get().fetchApproved();
    } catch (_e) {
      // 审批通过失败
    }
  },

  reject: async (id, reason) => {
    try {
      await approvalApi.reject(id, reason);
      set({
        pendingApprovals: get().pendingApprovals.filter((a) => a.id !== id),
        currentApproval: null,
      });
      get().fetchApproved();
    } catch (_e) {
      // 审批拒绝失败
    }
  },

  setCurrentApproval: (approval) => set({ currentApproval: approval }),
}));
