import api from "../utils/api";
import {
  Ticket,
  TicketStatus,
  TicketPriority,
  CreateTicketDto,
  PaginatedResponse,
  TicketLog,
} from "../types";

export const ticketApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: TicketStatus;
    priority?: TicketPriority;
  }): Promise<PaginatedResponse<Ticket>> => {
    return api.get("/tickets", { params });
  },

  get: async (id: string): Promise<Ticket & { logs: TicketLog[] }> => {
    return api.get(`/tickets/${id}`);
  },

  create: async (data: CreateTicketDto): Promise<Ticket> => {
    return api.post("/tickets", data);
  },

  assign: async (
    id: string,
    assigneeUserId: string,
    version: number,
  ): Promise<Ticket> => {
    return api.post(`/tickets/${id}/assign`, { assigneeUserId, version });
  },

  start: async (id: string, version: number): Promise<Ticket> => {
    return api.post(`/tickets/${id}/start`, { version });
  },

  resolve: async (
    id: string,
    solution: string,
    version: number,
  ): Promise<Ticket> => {
    return api.post(`/tickets/${id}/resolve`, { solution, version });
  },

  close: async (
    id: string,
    closeReason?: string,
    version?: number,
  ): Promise<Ticket> => {
    return api.post(`/tickets/${id}/close`, { closeReason, version });
  },
};
