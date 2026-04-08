import api from "../utils/api";
import {
  Conversation,
  ConversationMessage,
  ConversationStatus,
  PaginatedResponse,
} from "../types";

export interface SendMessageDto {
  messageType: "text" | "image" | "file" | "audio" | "video" | "card";
  content: string;
  attachments?: Record<string, unknown>[];
  version: number;
}

export const conversationApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: ConversationStatus;
    channelId?: string;
  }): Promise<PaginatedResponse<Conversation>> => {
    return api.get("/conversations", { params });
  },

  get: async (id: string): Promise<Conversation> => {
    return api.get(`/conversations/${id}`);
  },

  getMessages: async (
    id: string,
    params?: { page?: number; page_size?: number },
  ): Promise<PaginatedResponse<ConversationMessage>> => {
    return api.get(`/conversations/${id}/messages`, { params });
  },

  sendMessage: async (
    id: string,
    data: SendMessageDto,
  ): Promise<ConversationMessage> => {
    return api.post(`/conversations/${id}/messages`, data);
  },

  accept: async (
    id: string,
    assigneeUserId: string,
    version: number,
  ): Promise<Conversation> => {
    return api.post(`/conversations/${id}/accept`, { assigneeUserId, version });
  },

  transfer: async (
    id: string,
    targetUserId: string,
    reason?: string,
    version?: number,
  ): Promise<Conversation> => {
    return api.post(`/conversations/${id}/transfer`, {
      targetUserId,
      reason,
      version,
    });
  },

  close: async (
    id: string,
    closedReason?: string,
    version?: number,
  ): Promise<Conversation> => {
    return api.post(`/conversations/${id}/close`, { closedReason, version });
  },
};
