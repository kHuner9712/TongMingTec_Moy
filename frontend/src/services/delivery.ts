import api from '../utils/api';
import {
  DeliveryOrder,
  DeliveryMilestone,
  DeliveryTaskRecord,
  DeliveryAcceptance,
  DeliveryRisk,
  DeliveryOutcome,
  DeliveryStatus,
  PaginatedResponse,
} from '../types';

export const deliveryApi = {
  list: async (params?: {
    page?: number;
    page_size?: number;
    status?: DeliveryStatus;
    customerId?: string;
    orderId?: string;
    subscriptionId?: string;
  }): Promise<PaginatedResponse<DeliveryOrder>> => {
    return api.get('/deliveries', { params });
  },

  get: async (id: string): Promise<{
    delivery: DeliveryOrder;
    milestones: DeliveryMilestone[];
    tasks: DeliveryTaskRecord[];
    acceptances: DeliveryAcceptance[];
    risks: DeliveryRisk[];
    outcomes: DeliveryOutcome[];
  }> => {
    return api.get(`/deliveries/${id}`);
  },

  getByOrder: async (orderId: string): Promise<DeliveryOrder> => {
    return api.get(`/deliveries/by-order/${orderId}`);
  },

  getBySubscription: async (subscriptionId: string): Promise<DeliveryOrder> => {
    return api.get(`/deliveries/by-subscription/${subscriptionId}`);
  },

  getCustomerSummary: async (customerId: string): Promise<{
    totalDeliveries: number;
    activeDeliveries: number;
    blockedDeliveries: number;
    acceptedDeliveries: number;
    achievedOutcomes: number;
    partialOutcomes: number;
    pendingRisks: number;
  }> => {
    return api.get(`/deliveries/customer/${customerId}/summary`);
  },

  create: async (data: {
    title: string;
    description?: string;
    customerId: string;
    contractId?: string;
    orderId?: string;
    paymentId?: string;
    subscriptionId?: string;
    successPlanId?: string;
    ownerUserId?: string;
    targetOutcomeSummary?: string;
  }): Promise<DeliveryOrder> => {
    return api.post('/deliveries', data);
  },

  update: async (
    id: string,
    data: {
      title?: string;
      description?: string;
      paymentId?: string;
      subscriptionId?: string;
      successPlanId?: string;
      ownerUserId?: string;
      targetOutcomeSummary?: string;
      version: number;
    },
  ): Promise<DeliveryOrder> => {
    return api.put(`/deliveries/${id}`, data);
  },

  changeStatus: async (
    id: string,
    data: {
      status: DeliveryStatus;
      reason?: string;
      version: number;
    },
  ): Promise<DeliveryOrder> => {
    return api.post(`/deliveries/${id}/status`, data);
  },

  createMilestone: async (
    deliveryId: string,
    data: {
      title: string;
      description?: string;
      sequence?: number;
      dueAt?: string;
      status?: 'pending' | 'done' | 'blocked';
    },
  ): Promise<DeliveryMilestone> => {
    return api.post(`/deliveries/${deliveryId}/milestones`, data);
  },

  createTask: async (
    deliveryId: string,
    data: {
      title: string;
      description?: string;
      ownerUserId?: string;
      dueAt?: string;
    },
  ): Promise<DeliveryTaskRecord> => {
    return api.post(`/deliveries/${deliveryId}/tasks`, data);
  },

  createAcceptance: async (
    deliveryId: string,
    data: {
      acceptanceType?: string;
      result?: 'pending' | 'accepted' | 'rejected';
      summary: string;
      payload?: Record<string, unknown>;
    },
  ): Promise<DeliveryAcceptance> => {
    return api.post(`/deliveries/${deliveryId}/acceptances`, data);
  },

  createRisk: async (
    deliveryId: string,
    data: {
      title: string;
      mitigationPlan?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      status?: 'open' | 'mitigated' | 'closed';
      ownerUserId?: string;
    },
  ): Promise<DeliveryRisk> => {
    return api.post(`/deliveries/${deliveryId}/risks`, data);
  },

  createOutcome: async (
    deliveryId: string,
    data: {
      outcomeCode: string;
      promisedValue: string;
      actualValue?: string;
      status?: 'pending' | 'achieved' | 'partial' | 'not_achieved';
      measuredAt?: string;
      note?: string;
    },
  ): Promise<DeliveryOutcome> => {
    return api.post(`/deliveries/${deliveryId}/outcomes`, data);
  },
};
