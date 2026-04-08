import { create } from 'zustand';
import { WorkbenchTodoItem, WorkbenchAiInsight } from '../types';

interface WorkbenchState {
  todoItems: WorkbenchTodoItem[];
  aiInsights: WorkbenchAiInsight[];
  pendingConversationCount: number;
  pendingTicketCount: number;
  loading: boolean;
  fetchWorkbenchData: () => Promise<void>;
}

export const useWorkbenchStore = create<WorkbenchState>()((set) => ({
  todoItems: [],
  aiInsights: [],
  pendingConversationCount: 0,
  pendingTicketCount: 0,
  loading: false,

  fetchWorkbenchData: async () => {
    set({ loading: true });
    try {
      set({
        todoItems: [],
        aiInsights: [],
        pendingConversationCount: 0,
        pendingTicketCount: 0,
      });
    } finally {
      set({ loading: false });
    }
  },
}));
