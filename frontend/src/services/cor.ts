import api from '../utils/api';
import { Customer360View, CustomerTimelineEvent, CustomerOperatingRecord } from '../types';

export const corApi = {
  getCustomer360: async (customerId: string): Promise<Customer360View> => {
    return api.get(`/cor/customers/${customerId}/360`);
  },

  getTimeline: async (customerId: string, params?: { eventType?: string; actorType?: string; page?: number; pageSize?: number }): Promise<{ items: CustomerTimelineEvent[]; total: number }> => {
    return api.get(`/cor/customers/${customerId}/timeline`, { params });
  },

  getRecords: async (customerId: string, params?: { page?: number; pageSize?: number }): Promise<{ items: CustomerOperatingRecord[]; total: number }> => {
    return api.get(`/cor/customers/${customerId}/records`, { params });
  },

  createRecord: async (customerId: string, data: { recordType: string; content: string; sourceType: string; aiSuggestion?: Record<string, unknown>; humanDecision?: string; sourceId?: string }): Promise<CustomerOperatingRecord> => {
    return api.post(`/cor/customers/${customerId}/records`, data);
  },
};
