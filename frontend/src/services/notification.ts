import api from "../utils/api";
import { Notification, PaginatedResponse } from "../types";

export interface NotificationPreferenceUpdatePayload {
  channels: Record<string, boolean>;
  muteCategories?: string[];
  digestTime?: string;
  version?: number;
}

export const notificationApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    is_read?: boolean;
    category?: string;
  }): Promise<PaginatedResponse<Notification>> => {
    return api.get("/notifications", { params });
  },

  unreadCount: async (): Promise<{ count: number }> => {
    return api.get("/notifications/unread-count");
  },

  markAsRead: async (id: string): Promise<{ code: string; message: string }> => {
    return api.post(`/notifications/${id}/read`, {});
  },

  markAllAsRead: async (): Promise<{ code: string; message: string }> => {
    return api.post("/notifications/read-all", {});
  },

  updatePreferences: async (
    payload: NotificationPreferenceUpdatePayload,
  ): Promise<{ code: string; message: string }> => {
    return api.put("/notification-preferences", payload);
  },
};
