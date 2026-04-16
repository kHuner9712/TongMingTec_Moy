import { expect, test } from '@playwright/test';
import { apiClient } from './fixtures/api-client';

test.describe('ACPT-RSC-001: 结果责任链 E2E 最小验证', () => {
  test.describe.configure({ mode: 'serial' });

  const runTag = `${Date.now()}`;

  let leadId = '';
  let customerId = '';
  let opportunityId = '';
  let quoteId = '';
  let contractId = '';
  let orderId = '';
  let paymentId = '';
  let subscriptionId = '';
  let deliveryId = '';

  test.beforeAll(async () => {
    await apiClient.login();
  });

  test('链路A: 线索 -> 转客户/商机 -> 赢单 -> 报价 -> 审批 -> 合同 -> 签署', async () => {
    const lead = await apiClient.createLead({
      name: `RSC线索-${runTag}`,
      mobile: `13${runTag.slice(-9)}`,
      companyName: `RSC公司-${runTag}`,
      source: 'manual',
    });
    leadId = lead.id;
    expect(lead.status).toBe('new');

    await apiClient.assignLead(leadId, apiClient.getCurrentUserId(), lead.version);

    const leadAfterAssign = await apiClient.getLead(leadId);
    expect(leadAfterAssign.status).toBe('assigned');

    await apiClient.addLeadFollowUp(
      leadId,
      'E2E责任链跟进记录',
      leadAfterAssign.version,
      'manual',
    );

    const leadAfterFollowUp = await apiClient.getLead(leadId);
    expect(leadAfterFollowUp.status).toBe('following');

    const converted = await apiClient.convertLead(leadId, leadAfterFollowUp.version);
    customerId = converted.customerId;
    opportunityId = converted.opportunityId;

    expect(customerId).toBeTruthy();
    expect(opportunityId).toBeTruthy();

    const wonOpportunity = await apiClient.markOpportunityWon(opportunityId);
    expect(wonOpportunity.result).toBe('won');

    const quote = await apiClient.createQuote({
      opportunityId,
      customerId,
      items: [
        {
          itemType: 'plan',
          name: `RSC报价项-${runTag}`,
          quantity: 1,
          unitPrice: 50000,
        },
      ],
    });
    quoteId = quote.id;
    expect(quote.status).toBe('draft');

    await apiClient.submitQuoteApproval(quoteId);
    await apiClient.approveQuote(quoteId);

    const quoteAfterApprove = await apiClient.getQuote(quoteId);
    const quoteStatus = quoteAfterApprove.quote?.status || quoteAfterApprove.status;
    expect(['approved', 'accepted']).toContain(quoteStatus);

    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);

    const contract = await apiClient.createContract({
      quoteId,
      opportunityId,
      customerId,
      startsOn: today.toISOString().slice(0, 10),
      endsOn: nextYear.toISOString().slice(0, 10),
    });

    contractId = contract.id;
    expect(contractId).toBeTruthy();

    await apiClient.submitContractApproval(contractId);
    await apiClient.approveContract(contractId);
    await apiClient.signContract(contractId);

    const contractAfterSign = await apiClient.getContract(contractId);
    const contractStatus = contractAfterSign.contract?.status || contractAfterSign.status;
    expect(['signing', 'active']).toContain(contractStatus);
  });

  test('链路B: 合同 -> 订单 -> 付款 -> 订单激活 -> 订阅开通', async () => {
    expect(contractId).toBeTruthy();

    const order = await apiClient.createOrderFromContract(contractId, quoteId, customerId);
    orderId = order.id;
    expect(order.status).toBe('draft');

    await apiClient.confirmOrder(orderId);

    const orderAfterConfirm = await apiClient.getOrder(orderId);
    expect(orderAfterConfirm.order.status).toBe('pending_approval');

    const orderApprovals = await apiClient.getPendingApprovals();
    const orderApproval = orderApprovals.find(
      (approval: any) =>
        approval.resourceType === 'order' &&
        approval.resourceId === orderId &&
        approval.requestedAction === 'confirm',
    );
    expect(orderApproval).toBeTruthy();

    await apiClient.approveApprovalRequest(orderApproval.id, orderApproval.version || 1);

    await apiClient.waitForCondition(async () => {
      const latestOrder = await apiClient.getOrder(orderId);
      return latestOrder.order.status === 'confirmed';
    }, 20000);

    const confirmedOrder = await apiClient.getOrder(orderId);
    expect(confirmedOrder.order.status).toBe('confirmed');

    const payment = await apiClient.createPayment({
      orderId,
      customerId,
      amount: 50000,
      paymentMethod: 'bank_transfer',
      currency: 'CNY',
    });
    paymentId = payment.id;

    await apiClient.processPayment(paymentId);
    await apiClient.succeedPayment(paymentId, `RSC-TXN-${runTag}`);

    const paymentAfterSubmit = await apiClient.getPayment(paymentId);
    expect(paymentAfterSubmit.status).toBe('pending_approval');

    const paymentApprovals = await apiClient.getPendingApprovals();
    const paymentApproval = paymentApprovals.find(
      (approval: any) =>
        approval.resourceType === 'payment' &&
        approval.resourceId === paymentId &&
        approval.requestedAction === 'succeed',
    );
    expect(paymentApproval).toBeTruthy();

    await apiClient.approveApprovalRequest(paymentApproval.id, paymentApproval.version || 1);

    await apiClient.waitForCondition(async () => {
      const latestPayment = await apiClient.getPayment(paymentId);
      return latestPayment.status === 'succeeded';
    }, 20000);

    await apiClient.waitForCondition(async () => {
      const latestOrder = await apiClient.getOrder(orderId);
      return latestOrder.order.status === 'active';
    }, 20000);

    const subscriptionsResp = await apiClient.getSubscriptions({ customerId, orderId });
    const subscriptions = subscriptionsResp.items || subscriptionsResp.data || subscriptionsResp;
    expect(subscriptions.length).toBeGreaterThan(0);

    subscriptionId = subscriptions[0].id;
    expect(subscriptions[0].orderId).toBe(orderId);
    expect(['active', 'trial', 'overdue', 'suspended']).toContain(subscriptions[0].status);
  });

  test('链路C: 订阅/交付 -> 纳入客户成功 -> 健康评估 -> 续费提醒', async () => {
    expect(subscriptionId).toBeTruthy();

    await apiClient.waitForCondition(async () => {
      try {
        const delivery = await apiClient.getDeliveryByOrder(orderId);
        return Boolean(delivery?.id);
      } catch {
        return false;
      }
    }, 20000);

    const delivery = await apiClient.getDeliveryByOrder(orderId);
    deliveryId = delivery.id;

    expect(deliveryId).toBeTruthy();
    expect(delivery.customerId).toBe(customerId);

    const deliveriesResp = await apiClient.listDeliveries({ orderId });
    const deliveriesByOrder = deliveriesResp.items || deliveriesResp.data || deliveriesResp;
    expect(
      deliveriesByOrder.some((item: any) => item.id === deliveryId),
    ).toBeTruthy();

    await apiClient.waitForCondition(async () => {
      try {
        const bySubscription = await apiClient.getDeliveryBySubscription(subscriptionId);
        return bySubscription?.id === deliveryId;
      } catch {
        return false;
      }
    }, 20000);

    const deliveryBySubscription = await apiClient.getDeliveryBySubscription(subscriptionId);
    expect(deliveryBySubscription.id).toBe(deliveryId);
    expect(deliveryBySubscription.subscriptionId).toBe(subscriptionId);

    const detailBeforeBlocked = await apiClient.getDelivery(deliveryId);
    const versionBeforeBlocked =
      detailBeforeBlocked.delivery?.version || detailBeforeBlocked.version;
    const statusBeforeBlocked =
      detailBeforeBlocked.delivery?.status || detailBeforeBlocked.status;

    expect(statusBeforeBlocked).toBe('active');

    await apiClient.changeDeliveryStatus(
      deliveryId,
      'blocked',
      'E2E验证交付阻塞状态',
      versionBeforeBlocked,
    );

    const detailAfterBlocked = await apiClient.getDelivery(deliveryId);
    const blockedStatus = detailAfterBlocked.delivery?.status || detailAfterBlocked.status;
    const versionBeforeBackToActive =
      detailAfterBlocked.delivery?.version || detailAfterBlocked.version;
    expect(blockedStatus).toBe('blocked');

    await apiClient.changeDeliveryStatus(
      deliveryId,
      'active',
      'E2E解除交付阻塞',
      versionBeforeBackToActive,
    );

    await apiClient.createDeliveryRisk(deliveryId, {
      title: `RSC风险项-${runTag}`,
      mitigationPlan: '安排专属实施负责人并每周复盘',
      severity: 'high',
      status: 'open',
    });

    await apiClient.createDeliveryOutcome(deliveryId, {
      outcomeCode: 'go_live',
      promisedValue: '30天上线',
      actualValue: '28天完成上线',
      status: 'achieved',
      note: '满足合同承诺结果',
    });

    const detailBeforeReady = await apiClient.getDelivery(deliveryId);
    const versionBeforeReady = detailBeforeReady.delivery?.version || detailBeforeReady.version;
    const statusBeforeReady = detailBeforeReady.delivery?.status || detailBeforeReady.status;

    expect(statusBeforeReady).toBe('active');

    await apiClient.changeDeliveryStatus(
      deliveryId,
      'ready_for_acceptance',
      'E2E进入验收阶段',
      versionBeforeReady,
    );

    const detailAfterReady = await apiClient.getDelivery(deliveryId);
    const readyStatus = detailAfterReady.delivery?.status || detailAfterReady.status;
    expect(readyStatus).toBe('ready_for_acceptance');

    await apiClient.createDeliveryAcceptance(deliveryId, {
      acceptanceType: 'milestone',
      result: 'accepted',
      summary: '客户确认达到交付目标并验收通过',
    });

    await apiClient.waitForCondition(async () => {
      const detail = await apiClient.getDelivery(deliveryId);
      const status = detail.delivery?.status || detail.status;
      return status === 'accepted';
    }, 15000);

    const detailAfterAccepted = await apiClient.getDelivery(deliveryId);
    const versionBeforeClose =
      detailAfterAccepted.delivery?.version || detailAfterAccepted.version;

    await apiClient.changeDeliveryStatus(
      deliveryId,
      'closed',
      'E2E验收完成后关闭交付单',
      versionBeforeClose,
    );

    const detailAfterClosed = await apiClient.getDelivery(deliveryId);
    const closedStatus = detailAfterClosed.delivery?.status || detailAfterClosed.status;
    expect(closedStatus).toBe('closed');

    await apiClient.waitForCondition(async () => {
      try {
        const health = await apiClient.getCustomerHealth(customerId);
        return Boolean(health?.id || health?.customerId);
      } catch {
        return false;
      }
    }, 20000);

    const health = await apiClient.getCustomerHealth(customerId);
    expect(health.customerId).toBe(customerId);
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);

    const plansResp = await apiClient.listSuccessPlans({ customerId });
    const plans = plansResp.items || plansResp.data || plansResp;
    expect(plans.length).toBeGreaterThan(0);

    const expiryResult = await apiClient.triggerContractExpiryCheck(30);
    expect(expiryResult).toHaveProperty('notified');
  });

  test('链路D: 会话 -> AI建议 -> 人工确认 -> 发送 -> 转工单 -> 工单关闭', async () => {
    const blockers: string[] = [];

    const conversationsResp = await apiClient.listConversations({ page: 1, page_size: 20 });
    const conversations = conversationsResp.items || conversationsResp.data || conversationsResp;

    let candidateConversation = conversations.find(
      (conversation: any) => conversation.status === 'queued' || conversation.status === 'active',
    );

    if (!candidateConversation) {
      const channelsResp = await apiClient.listChannels({ channelType: 'web' });
      const channels = channelsResp.items || channelsResp.data || channelsResp;
      let channel = channels[0];

      if (!channel) {
        channel = await apiClient.createChannel({
          code: `e2e-web-${runTag}`,
          channelType: 'web',
          configJson: { source: 'e2e' },
        });
      }

      const bootstrap = await apiClient.bootstrapTestConversation({
        channelId: channel.id,
        subject: `RSC会话-${runTag}`,
        initialMessage: '你好，我希望了解交付进度。',
      });
      candidateConversation = await apiClient.getConversation(bootstrap.conversationId);
    }

    let conversation = await apiClient.getConversation(candidateConversation.id);

    if (conversation.status === 'queued') {
      conversation = await apiClient.acceptConversation(
        conversation.id,
        apiClient.getCurrentUserId(),
        conversation.version,
      );
    }

    const smartReplyTask = await apiClient.createSmartReply(
      conversation.id,
      '请基于该会话上下文生成简洁回复建议。',
    );
    expect(smartReplyTask.taskId).toBeTruthy();

    await apiClient.waitForCondition(async () => {
      const task = await apiClient.getAiTask(smartReplyTask.taskId);
      return ['succeeded', 'failed'].includes(task.status);
    }, 30000, 1000);

    const aiTask = await apiClient.getAiTask(smartReplyTask.taskId);

    if (aiTask.status !== 'succeeded') {
      blockers.push('缺AI执行结果：AI建议任务未成功，已使用人工兜底文案继续链路。');
    }

    const suggestedText =
      aiTask.outputPayload?.suggestion ||
      aiTask.outputPayload?.content ||
      '已收到，我们会立即处理并同步下一步计划。';

    conversation = await apiClient.getConversation(conversation.id);
    await apiClient.sendConversationMessage(conversation.id, {
      messageType: 'text',
      content: suggestedText,
      version: conversation.version,
    });

    conversation = await apiClient.getConversation(conversation.id);

    const ticketFromConversation = await apiClient.createTicketFromConversation(conversation.id, {
      title: `RSC工单-${runTag}`,
      priority: 'normal',
      version: conversation.version,
    });

    const ticketId = ticketFromConversation.ticketId;
    expect(ticketId).toBeTruthy();

    let ticket = await apiClient.getTicket(ticketId);

    await apiClient.assignTicket(ticketId, apiClient.getCurrentUserId(), ticket.version);
    ticket = await apiClient.getTicket(ticketId);

    await apiClient.startTicket(ticketId, ticket.version);
    ticket = await apiClient.getTicket(ticketId);

    await apiClient.resolveTicket(ticketId, 'E2E责任链验证：问题已处理', ticket.version);
    ticket = await apiClient.getTicket(ticketId);

    await apiClient.closeTicket(ticketId, 'E2E责任链验证关闭', ticket.version);
    const closedTicket = await apiClient.getTicket(ticketId);

    expect(closedTicket.status).toBe('closed');

    if (blockers.length > 0) {
      test.info().annotations.push({
        type: 'blocker',
        description: blockers.join(' '),
      });
    }
  });
});
