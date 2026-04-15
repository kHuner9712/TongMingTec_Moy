import axios from 'axios';

const API_BASE = 'http://localhost:3001/api/v1';
const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class ApiClient {
  private token: string = '';
  private orgId: string = '';
  private userId: string = '';

  getAccessToken(): string {
    return this.token;
  }

  getCurrentOrgId(): string {
    return this.orgId;
  }

  getCurrentUserId(): string {
    return this.userId;
  }

  async login(
    username: string = 'admin',
    password: string = 'Admin123!',
  ): Promise<void> {
    const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
    this.token = res.data.tokens.accessToken;
    this.orgId = res.data.user.orgId;
    this.userId = res.data.user.id;
  }

  private get headers() {
    return { Authorization: `Bearer ${this.token}` };
  }

  private asItems<T = any>(data: any): T[] {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.items)) return data.items;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  }

  private versionOf(payload: any): number {
    if (typeof payload?.version === 'number') return payload.version;
    if (typeof payload?.quote?.version === 'number') return payload.quote.version;
    if (typeof payload?.contract?.version === 'number') return payload.contract.version;
    if (typeof payload?.order?.version === 'number') return payload.order.version;
    if (typeof payload?.subscription?.version === 'number') return payload.subscription.version;
    if (typeof payload?.delivery?.version === 'number') return payload.delivery.version;
    return 1;
  }

  private ensureApproverIds(approverIds: string[]): string[] {
    const ids = approverIds.filter(Boolean);
    if (ids.length > 0) return ids;
    if (this.userId) return [this.userId];
    throw new Error('No approver id available, please login first.');
  }

  private isUuid(value?: string | null): boolean {
    return Boolean(value && UUID_V4_REGEX.test(value));
  }

  async createCustomer(data: {
    name: string;
    phone: string;
    company?: string;
  }): Promise<any> {
    const res = await axios.post(`${API_BASE}/customers`, data, {
      headers: this.headers,
    });
    return res.data;
  }

  async getCustomers(): Promise<any> {
    const res = await axios.get(`${API_BASE}/customers`, { headers: this.headers });
    return res.data;
  }

  async createLead(data: {
    name: string;
    mobile?: string;
    email?: string;
    companyName?: string;
    source?: string;
  }): Promise<any> {
    const res = await axios.post(`${API_BASE}/leads`, data, {
      headers: this.headers,
    });
    return res.data;
  }

  async getLead(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/leads/${id}`, { headers: this.headers });
    return res.data;
  }

  async assignLead(id: string, ownerUserId: string, version: number): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/leads/${id}/assign`,
      { ownerUserId, version },
      { headers: this.headers },
    );
    return res.data;
  }

  async addLeadFollowUp(
    id: string,
    content: string,
    version: number,
    followType: 'call' | 'wechat' | 'email' | 'meeting' | 'manual' = 'manual',
  ): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/leads/${id}/follow-ups`,
      { content, followType, version },
      { headers: this.headers },
    );
    return res.data;
  }

  async convertLead(id: string, version: number): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/leads/${id}/convert`,
      { version },
      { headers: this.headers },
    );
    return res.data;
  }

  async createOpportunity(data: {
    customerId: string;
    leadId?: string;
    name: string;
    amount?: number;
    estimatedAmount?: number;
  }): Promise<any> {
    const payload = {
      customerId: data.customerId,
      leadId: data.leadId,
      name: data.name,
      amount: data.amount ?? data.estimatedAmount,
    };

    const res = await axios.post(`${API_BASE}/opportunities`, payload, {
      headers: this.headers,
    });
    return res.data;
  }

  async getOpportunity(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/opportunities/${id}`, {
      headers: this.headers,
    });
    return res.data;
  }

  async changeOpportunityStage(
    id: string,
    toStage: 'discovery' | 'qualification' | 'proposal' | 'negotiation',
    version: number,
    reason: string = 'E2E阶段推进',
  ): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/opportunities/${id}/stage`,
      { toStage, reason, version },
      { headers: this.headers },
    );
    return res.data;
  }

  async markOpportunityWon(id: string): Promise<any> {
    let opportunity = await this.getOpportunity(id);

    const stagePath: Array<'qualification' | 'proposal' | 'negotiation'> = [
      'qualification',
      'proposal',
      'negotiation',
    ];

    for (const nextStage of stagePath) {
      if (opportunity.stage === nextStage) continue;
      if (opportunity.stage === 'negotiation') break;
      opportunity = await this.changeOpportunityStage(
        id,
        nextStage,
        opportunity.version,
        `E2E推进至${nextStage}`,
      );
    }

    opportunity = await this.getOpportunity(id);
    const res = await axios.post(
      `${API_BASE}/opportunities/${id}/result`,
      {
        result: 'won',
        reason: 'E2E验收测试赢单',
        version: opportunity.version,
      },
      { headers: this.headers },
    );
    return res.data;
  }

  async createQuote(data: {
    opportunityId: string;
    customerId: string;
    currency?: string;
    validUntil?: string;
    items: Array<{
      itemType?: string;
      refId?: string;
      description?: string;
      name?: string;
      quantity: number;
      unitPrice: number;
      amount?: number;
    }>;
  }): Promise<any> {
    const items = data.items.map((item) => {
      const quantity = Number(item.quantity ?? 1);
      const unitPrice = Number(item.unitPrice ?? 0);
      return {
        itemType: item.itemType || 'plan',
        refId: item.refId,
        description: item.description || item.name || 'E2E报价项',
        quantity,
        unitPrice,
        amount: Number(item.amount ?? quantity * unitPrice),
      };
    });

    const res = await axios.post(
      `${API_BASE}/quotes`,
      {
        opportunityId: data.opportunityId,
        customerId: data.customerId,
        currency: data.currency,
        validUntil: data.validUntil,
        items,
      },
      { headers: this.headers },
    );
    return res.data;
  }

  async getQuote(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/quotes/${id}`, { headers: this.headers });
    return res.data;
  }

  async submitQuoteApproval(
    id: string,
    approverIds: string[] = [],
    version?: number,
  ): Promise<any> {
    const quote = await this.getQuote(id);
    const finalVersion = version ?? this.versionOf(quote);

    const res = await axios.post(
      `${API_BASE}/quotes/${id}/submit-approval`,
      {
        approverIds: this.ensureApproverIds(approverIds),
        comment: 'E2E验收测试提交审批',
        version: finalVersion,
      },
      { headers: this.headers },
    );
    return res.data;
  }

  async approveQuote(
    id: string,
    action: 'approved' | 'rejected' = 'approved',
    comment?: string,
  ): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/quotes/${id}/approve`,
      { action, comment: comment || 'E2E验收测试审批通过' },
      { headers: this.headers },
    );
    return res.data;
  }

  async createContract(data: {
    quoteId?: string;
    opportunityId: string;
    customerId: string;
    startsOn?: string;
    endsOn?: string;
  }): Promise<any> {
    const payload = {
      quoteId: data.quoteId,
      opportunityId: data.opportunityId,
      customerId: data.customerId,
      startsOn: data.startsOn,
      endsOn: data.endsOn,
    };

    const res = await axios.post(`${API_BASE}/contracts`, payload, {
      headers: this.headers,
    });
    return res.data;
  }

  async listContracts(params?: {
    opportunityId?: string;
    customerId?: string;
    status?: string;
  }): Promise<any> {
    const res = await axios.get(`${API_BASE}/contracts`, {
      params,
      headers: this.headers,
    });
    return res.data;
  }

  async getContract(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/contracts/${id}`, {
      headers: this.headers,
    });
    return res.data;
  }

  async submitContractApproval(
    id: string,
    approverIds: string[] = [],
    version?: number,
  ): Promise<any> {
    const contract = await this.getContract(id);
    const finalVersion = version ?? this.versionOf(contract);

    const res = await axios.post(
      `${API_BASE}/contracts/${id}/submit-approval`,
      {
        approverIds: this.ensureApproverIds(approverIds),
        comment: 'E2E验收测试提交审批',
        version: finalVersion,
      },
      { headers: this.headers },
    );
    return res.data;
  }

  async approveContract(id: string): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/contracts/${id}/approve`,
      { action: 'approved', comment: 'E2E验收测试审批通过' },
      { headers: this.headers },
    );
    return res.data;
  }

  async signContract(id: string, version?: number): Promise<any> {
    const contract = await this.getContract(id);
    const finalVersion = version ?? this.versionOf(contract);

    const res = await axios.post(
      `${API_BASE}/contracts/${id}/sign`,
      { signProvider: 'manual', version: finalVersion },
      { headers: this.headers },
    );
    return res.data;
  }

  async activateContract(id: string): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/contracts/${id}/activate`,
      {},
      { headers: this.headers },
    );
    return res.data;
  }

  async terminateContract(id: string, reason: string): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/contracts/${id}/terminate`,
      { reason },
      { headers: this.headers },
    );
    return res.data;
  }

  async createOrder(data: {
    customerId: string;
    contractId?: string;
    quoteId?: string;
    currency?: string;
    orderType?: 'new' | 'renewal' | 'addon' | 'refund';
    items?: Array<{ itemType?: string; refId?: string; quantity: number; unitPrice: number }>;
  }): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/orders`,
      {
        customerId: data.customerId,
        contractId: data.contractId,
        quoteId: data.quoteId,
        currency: data.currency,
        orderType: data.orderType,
        items:
          data.items && data.items.length > 0
            ? data.items.map((item) => ({
                itemType: item.itemType || 'plan',
                refId: item.refId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
              }))
            : [{ itemType: 'plan', quantity: 1, unitPrice: 0 }],
      },
      { headers: this.headers },
    );
    return res.data;
  }

  async createOrderFromContract(
    contractId: string,
    quoteId: string,
    customerId: string,
  ): Promise<any> {
    if (!this.isUuid(contractId)) {
      return this.createOrder({
        customerId,
        quoteId: this.isUuid(quoteId) ? quoteId : undefined,
      });
    }

    const res = await axios.post(
      `${API_BASE}/orders/from-contract`,
      {
        contractId,
        quoteId: this.isUuid(quoteId) ? quoteId : undefined,
        customerId,
      },
      { headers: this.headers },
    );
    return res.data;
  }

  async getOrder(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/orders/${id}`, { headers: this.headers });
    return res.data;
  }

  async listOrders(params?: {
    status?: string;
    customerId?: string;
    orderType?: string;
  }): Promise<any> {
    const res = await axios.get(`${API_BASE}/orders`, { params, headers: this.headers });
    return res.data;
  }

  async confirmOrder(id: string, version?: number): Promise<any> {
    const order = await this.getOrder(id);
    const finalVersion = version ?? this.versionOf(order);
    const res = await axios.post(
      `${API_BASE}/orders/${id}/confirm`,
      {},
      {
        headers: this.headers,
        params: { version: finalVersion },
      },
    );
    return res.data;
  }

  async activateOrder(id: string, version?: number): Promise<any> {
    const order = await this.getOrder(id);
    const finalVersion = version ?? this.versionOf(order);
    const res = await axios.post(
      `${API_BASE}/orders/${id}/activate`,
      {},
      {
        headers: this.headers,
        params: { version: finalVersion },
      },
    );
    return res.data;
  }

  async createPayment(data: {
    orderId: string;
    customerId: string;
    amount: number;
    paymentMethod?: string;
    currency?: string;
    externalTxnId?: string;
    remark?: string;
  }): Promise<any> {
    const res = await axios.post(`${API_BASE}/payments`, data, {
      headers: this.headers,
    });
    return res.data;
  }

  async getPayment(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/payments/${id}`, { headers: this.headers });
    return res.data;
  }

  async listPayments(params?: {
    status?: string;
    orderId?: string;
    customerId?: string;
  }): Promise<any> {
    const res = await axios.get(`${API_BASE}/payments`, {
      params,
      headers: this.headers,
    });
    return res.data;
  }

  async processPayment(id: string, version?: number): Promise<any> {
    const payment = await this.getPayment(id);
    const finalVersion = version ?? this.versionOf(payment);
    const res = await axios.post(
      `${API_BASE}/payments/${id}/process`,
      {},
      {
        headers: this.headers,
        params: { version: finalVersion },
      },
    );
    return res.data;
  }

  async succeedPayment(id: string, externalTxnId?: string, version?: number): Promise<any> {
    const payment = await this.getPayment(id);
    const finalVersion = version ?? this.versionOf(payment);
    const res = await axios.post(
      `${API_BASE}/payments/${id}/succeed`,
      { externalTxnId, version: finalVersion },
      { headers: this.headers },
    );
    return res.data;
  }

  async failPayment(id: string, version?: number): Promise<any> {
    const payment = await this.getPayment(id);
    const finalVersion = version ?? this.versionOf(payment);
    const res = await axios.post(
      `${API_BASE}/payments/${id}/fail`,
      {},
      {
        headers: this.headers,
        params: { version: finalVersion },
      },
    );
    return res.data;
  }

  async refundPayment(id: string, version?: number): Promise<any> {
    const payment = await this.getPayment(id);
    const finalVersion = version ?? this.versionOf(payment);
    const res = await axios.post(
      `${API_BASE}/payments/${id}/refund`,
      {},
      {
        headers: this.headers,
        params: { version: finalVersion },
      },
    );
    return res.data;
  }

  async voidPayment(id: string, version?: number): Promise<any> {
    const payment = await this.getPayment(id);
    const finalVersion = version ?? this.versionOf(payment);
    const res = await axios.post(
      `${API_BASE}/payments/${id}/void`,
      {},
      {
        headers: this.headers,
        params: { version: finalVersion },
      },
    );
    return res.data;
  }

  async getSubscriptions(params?: { customerId?: string; orderId?: string }): Promise<any> {
    const query = { customerId: params?.customerId };
    const res = await axios.get(`${API_BASE}/subscriptions`, {
      params: query,
      headers: this.headers,
    });

    if (!params?.orderId) return res.data;

    const items = this.asItems(res.data).filter((item) => item.orderId === params.orderId);
    if (Array.isArray(res.data)) return items;
    return { ...res.data, items };
  }

  async getSubscription(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/subscriptions/${id}`, { headers: this.headers });
    return res.data;
  }

  async suspendSubscription(id: string, reason: string, version: number): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/subscriptions/${id}/suspend`,
      { reason, version },
      { headers: this.headers },
    );
    return res.data;
  }

  async cancelSubscription(id: string, reason?: string, version?: number): Promise<any> {
    const sub = await this.getSubscription(id);
    const finalVersion = version ?? this.versionOf(sub);
    const res = await axios.post(
      `${API_BASE}/subscriptions/${id}/cancel`,
      { reason, version: finalVersion },
      { headers: this.headers },
    );
    return res.data;
  }

  async renewSubscription(
    id: string,
    newEndsAt: string,
    version: number,
    renewedByOrderId?: string,
  ): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/subscriptions/${id}/renew`,
      { newEndsAt, version, renewedByOrderId },
      { headers: this.headers },
    );
    return res.data;
  }

  async updateSubscription(id: string, data: {
    seatCount?: number;
    autoRenew?: boolean;
    endsAt?: string;
    version: number;
  }): Promise<any> {
    const res = await axios.put(`${API_BASE}/subscriptions/${id}`, data, {
      headers: this.headers,
    });
    return res.data;
  }

  async listDeliveries(params?: {
    status?: string;
    customerId?: string;
    orderId?: string;
    subscriptionId?: string;
  }): Promise<any> {
    const res = await axios.get(`${API_BASE}/deliveries`, {
      params,
      headers: this.headers,
    });
    return res.data;
  }

  async getDelivery(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/deliveries/${id}`, {
      headers: this.headers,
    });
    return res.data;
  }

  async getDeliveryByOrder(orderId: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/deliveries/by-order/${orderId}`, {
      headers: this.headers,
    });
    return res.data;
  }

  async getDeliveryBySubscription(subscriptionId: string): Promise<any> {
    const res = await axios.get(
      `${API_BASE}/deliveries/by-subscription/${subscriptionId}`,
      { headers: this.headers },
    );
    return res.data;
  }

  async getDeliveryCustomerSummary(customerId: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/deliveries/customer/${customerId}/summary`, {
      headers: this.headers,
    });
    return res.data;
  }

  async changeDeliveryStatus(
    id: string,
    status: 'draft' | 'active' | 'blocked' | 'ready_for_acceptance' | 'accepted' | 'closed',
    reason?: string,
    version?: number,
  ): Promise<any> {
    const detail = await this.getDelivery(id);
    const currentVersion = version ?? this.versionOf(detail);
    const res = await axios.post(
      `${API_BASE}/deliveries/${id}/status`,
      { status, reason, version: currentVersion },
      { headers: this.headers },
    );
    return res.data;
  }

  async createDeliveryRisk(
    deliveryId: string,
    data: {
      title: string;
      mitigationPlan?: string;
      severity?: 'low' | 'medium' | 'high' | 'critical';
      status?: 'open' | 'mitigated' | 'closed';
    },
  ): Promise<any> {
    const res = await axios.post(`${API_BASE}/deliveries/${deliveryId}/risks`, data, {
      headers: this.headers,
    });
    return res.data;
  }

  async createDeliveryOutcome(
    deliveryId: string,
    data: {
      outcomeCode: string;
      promisedValue: string;
      actualValue?: string;
      status?: 'pending' | 'achieved' | 'partial' | 'not_achieved';
      note?: string;
    },
  ): Promise<any> {
    const res = await axios.post(`${API_BASE}/deliveries/${deliveryId}/outcomes`, data, {
      headers: this.headers,
    });
    return res.data;
  }

  async createDeliveryAcceptance(
    deliveryId: string,
    data: {
      acceptanceType?: string;
      result?: 'pending' | 'accepted' | 'rejected';
      summary: string;
      payload?: Record<string, unknown>;
    },
  ): Promise<any> {
    const res = await axios.post(`${API_BASE}/deliveries/${deliveryId}/acceptances`, data, {
      headers: this.headers,
    });
    return res.data;
  }

  async getCustomerHealth(customerId: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/csm/health/${customerId}`, {
      headers: this.headers,
    });
    return res.data;
  }

  async getCustomerHealthScores(params?: { customerId?: string; level?: string }): Promise<any> {
    const res = await axios.get(`${API_BASE}/csm/health`, {
      params,
      headers: this.headers,
    });
    return res.data;
  }

  async evaluateCustomerHealth(customerId: string): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/csm/health/evaluate`,
      { customerId },
      { headers: this.headers },
    );
    return res.data;
  }

  async listSuccessPlans(params?: { customerId?: string; status?: string }): Promise<any> {
    const res = await axios.get(`${API_BASE}/csm/plans`, { params, headers: this.headers });
    return res.data;
  }

  async getSuccessPlan(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/csm/plans/${id}`, { headers: this.headers });
    return res.data;
  }

  async updateSuccessPlan(
    id: string,
    data: {
      title?: string;
      status?: 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled';
      payload?: Record<string, unknown>;
      version: number;
    },
  ): Promise<any> {
    const res = await axios.put(`${API_BASE}/csm/plans/${id}`, data, {
      headers: this.headers,
    });
    return res.data;
  }

  async listConversations(params?: {
    status?: string;
    channelId?: string;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    const res = await axios.get(`${API_BASE}/conversations`, {
      params,
      headers: this.headers,
    });
    return res.data;
  }

  async getConversation(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/conversations/${id}`, {
      headers: this.headers,
    });
    return res.data;
  }

  async createSmartReply(conversationId: string, prompt: string): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/ai/smart-reply`,
      { conversationId, prompt },
      { headers: this.headers },
    );
    return res.data;
  }

  async getAiTask(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/ai/tasks/${id}`, { headers: this.headers });
    return res.data;
  }

  async sendConversationMessage(
    conversationId: string,
    data: {
      messageType: 'text' | 'image' | 'file' | 'audio' | 'video' | 'card';
      content: string;
      attachments?: Record<string, unknown>[];
      version: number;
    },
  ): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/conversations/${conversationId}/messages`,
      data,
      { headers: this.headers },
    );
    return res.data;
  }

  async acceptConversation(
    conversationId: string,
    assigneeUserId: string,
    version: number,
  ): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/conversations/${conversationId}/accept`,
      { assigneeUserId, version },
      { headers: this.headers },
    );
    return res.data;
  }

  async createTicketFromConversation(
    conversationId: string,
    data: { title: string; priority?: 'low' | 'normal' | 'high' | 'urgent'; version: number },
  ): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/conversations/${conversationId}/tickets`,
      data,
      { headers: this.headers },
    );
    return res.data;
  }

  async listTickets(params?: {
    status?: string;
    priority?: string;
    page?: number;
    page_size?: number;
  }): Promise<any> {
    const res = await axios.get(`${API_BASE}/tickets`, { params, headers: this.headers });
    return res.data;
  }

  async getTicket(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/tickets/${id}`, { headers: this.headers });
    return res.data;
  }

  async assignTicket(id: string, assigneeUserId: string, version: number): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/tickets/${id}/assign`,
      { assigneeUserId, version },
      { headers: this.headers },
    );
    return res.data;
  }

  async startTicket(id: string, version: number): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/tickets/${id}/start`,
      { version },
      { headers: this.headers },
    );
    return res.data;
  }

  async resolveTicket(id: string, solution: string, version: number): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/tickets/${id}/resolve`,
      { solution, version },
      { headers: this.headers },
    );
    return res.data;
  }

  async closeTicket(id: string, closeReason: string, version: number): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/tickets/${id}/close`,
      { closeReason, version },
      { headers: this.headers },
    );
    return res.data;
  }

  async getPendingApprovals(): Promise<any[]> {
    const res = await axios.get(`${API_BASE}/art/approvals`, {
      params: { status: 'pending' },
      headers: this.headers,
    });
    return this.asItems(res.data);
  }

  async approveApprovalRequest(id: string, version?: number): Promise<any> {
    const finalVersion = version ?? (await this.resolveApprovalVersion(id));
    const res = await axios.post(
      `${API_BASE}/art/approvals/${id}/approve`,
      { version: finalVersion },
      { headers: this.headers },
    );
    return res.data;
  }

  async rejectApprovalRequest(id: string, reason?: string, version?: number): Promise<any> {
    const finalVersion = version ?? (await this.resolveApprovalVersion(id));
    const res = await axios.post(
      `${API_BASE}/art/approvals/${id}/reject`,
      { reason, version: finalVersion },
      { headers: this.headers },
    );
    return res.data;
  }

  async loginAs(
    username: string,
    password: string,
  ): Promise<{ token: string; orgId: string; userId: string }> {
    const res = await axios.post(`${API_BASE}/auth/login`, { username, password });
    return {
      token: res.data.tokens.accessToken,
      orgId: res.data.user.orgId,
      userId: res.data.user.id,
    };
  }

  async getApprovalsWithToken(token: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/art/approvals`, {
      params: { status: 'pending' },
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  async approveApprovalRequestWithToken(
    id: string,
    token: string,
    version: number = 1,
  ): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/art/approvals/${id}/approve`,
      { version },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return res.data;
  }

  async createOrg(data: { name: string; slug: string }): Promise<any> {
    const res = await axios.post(`${API_BASE}/orgs`, data, { headers: this.headers });
    return res.data;
  }

  async bootstrapOrg(orgId: string, data: {
    adminUsername: string;
    adminPassword: string;
    adminEmail: string;
  }): Promise<any> {
    const res = await axios.post(`${API_BASE}/orgs/${orgId}/bootstrap`, data, {
      headers: this.headers,
    });
    return res.data;
  }

  async triggerContractExpiryCheck(warningDays?: number): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/contracts/expire-check`,
      { warningDays },
      { headers: this.headers },
    );
    return res.data;
  }

  async triggerContractExpireOverdue(): Promise<any> {
    const res = await axios.post(
      `${API_BASE}/contracts/expire-overdue`,
      {},
      { headers: this.headers },
    );
    return res.data;
  }

  async createAutomationTrigger(data: {
    name: string;
    eventType: string;
    actionType: string;
    condition?: Record<string, unknown>;
    actionPayload?: Record<string, unknown>;
  }): Promise<any> {
    const res = await axios.post(`${API_BASE}/automation/triggers`, data, {
      headers: this.headers,
    });
    return res.data;
  }

  async getAutomationTriggers(params?: { status?: string; eventType?: string }): Promise<any> {
    const res = await axios.get(`${API_BASE}/automation/triggers`, {
      params,
      headers: this.headers,
    });
    return res.data;
  }

  async getAutomationTrigger(id: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/automation/triggers/${id}`, {
      headers: this.headers,
    });
    return res.data;
  }

  async getCustomersWithToken(token: string): Promise<any> {
    const res = await axios.get(`${API_BASE}/customers`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  }

  async waitForCondition(
    checkFn: () => Promise<boolean>,
    timeoutMs: number = 10000,
    intervalMs: number = 500,
  ): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (await checkFn()) return;
      await new Promise((r) => setTimeout(r, intervalMs));
    }
    throw new Error(`waitForCondition timed out after ${timeoutMs}ms`);
  }

  private async resolveApprovalVersion(id: string): Promise<number> {
    const approvals = await this.getPendingApprovals();
    const approval = approvals.find((item: any) => item.id === id);
    return approval?.version || 1;
  }
}

export const apiClient = new ApiClient();
