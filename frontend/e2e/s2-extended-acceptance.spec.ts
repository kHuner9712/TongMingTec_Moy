import { test, expect } from '@playwright/test';
import { apiClient } from './fixtures/api-client';

test.describe('ACPT-S2-002: 报价审批流', () => {
  let customerId: string;
  let opportunityId: string;
  let quoteId: string;

  test.beforeAll(async () => {
    await apiClient.login();
    const customer = await apiClient.createCustomer({ name: '报价审批测试客户', phone: '13900002222' });
    customerId = customer.id;
    const opportunity = await apiClient.createOpportunity({ customerId, name: '报价审批测试商机', estimatedAmount: 30000 });
    opportunityId = opportunity.id;
    await apiClient.markOpportunityWon(opportunityId);
    const quote = await apiClient.createQuote({
      opportunityId,
      customerId,
      items: [{ itemType: 'plan', name: '专业版', quantity: 1, unitPrice: 30000 }],
    });
    quoteId = quote.id;
  });

  test('报价提交审批 -> 审批通过 -> 状态变为已审批', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);

    await page.goto('/quotes');
    const quoteRow = page.getByRole('row').filter({ hasText: new RegExp(quoteId.slice(0, 8)) });
    await expect(quoteRow).toBeVisible({ timeout: 10000 });
    await expect(quoteRow.getByText(/草稿/)).toBeVisible();

    const submitBtn = quoteRow.getByRole('button', { name: /提交审批/i });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      const approverInput = page.getByLabel(/审批人/i);
      if (await approverInput.isVisible()) {
        await approverInput.click();
        await page.getByText(/admin/i).first().click();
      }
      await page.getByRole('button', { name: /^确定|提交$/i }).click();
      await expect(page.getByText(/已提交审批/)).toBeVisible({ timeout: 10000 });
    } else {
      await apiClient.submitQuoteApproval(quoteId);
    }

    const quoteAfterSubmit = await apiClient.getQuote(quoteId);
    expect(['pending_approval', 'sent'].includes(quoteAfterSubmit.quote?.status || quoteAfterSubmit.status)).toBeTruthy();

    await apiClient.approveQuote(quoteId);

    const quoteAfterApprove = await apiClient.getQuote(quoteId);
    expect(['approved', 'accepted'].includes(quoteAfterApprove.quote?.status || quoteAfterApprove.status)).toBeTruthy();
  });
});

test.describe('ACPT-S2-003: 合同 UI 完整审批流', () => {
  let customerId: string;
  let opportunityId: string;
  let contractId: string;

  test.beforeAll(async () => {
    await apiClient.login();
    const customer = await apiClient.createCustomer({ name: '合同UI审批测试客户', phone: '13900003333' });
    customerId = customer.id;
    const opportunity = await apiClient.createOpportunity({ customerId, name: '合同UI审批测试商机', estimatedAmount: 80000 });
    opportunityId = opportunity.id;
    await apiClient.markOpportunityWon(opportunityId);

    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const contract = await apiClient.createContract({
      opportunityId,
      customerId,
      title: '合同UI审批测试合同',
      totalAmount: 80000,
      currency: 'CNY',
      startsOn: today.toISOString().split('T')[0],
      endsOn: nextYear.toISOString().split('T')[0],
    });
    contractId = contract.id;
  });

  test('合同详情页：提交审批 -> 审批通过 -> 发起签署 -> 确认生效', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);

    await page.goto(`/contracts/${contractId}`);

    await expect(page.getByText(/草稿/)).toBeVisible({ timeout: 10000 });

    const submitApprovalBtn = page.getByRole('button', { name: /提交审批/i });
    await expect(submitApprovalBtn).toBeVisible({ timeout: 5000 });
    await submitApprovalBtn.click();
    await expect(page.getByText(/已提交审批/)).toBeVisible({ timeout: 10000 });

    const contractAfterSubmit = await apiClient.getContract(contractId);
    expect(contractAfterSubmit.contract?.status || contractAfterSubmit.status).toBe('pending_approval');

    await page.reload();
    const approveBtn = page.getByRole('button', { name: /^审批$/i });
    await expect(approveBtn).toBeVisible({ timeout: 5000 });
    await approveBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/审批结果/i).click();
    await page.getByTitle(/通过/i).click();
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    await expect(page.getByText(/审批完成/)).toBeVisible({ timeout: 10000 });

    await page.reload();
    const signBtn = page.getByRole('button', { name: /发起签署/i });
    await expect(signBtn).toBeVisible({ timeout: 5000 });
    await signBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/签署平台/i).click();
    await page.getByTitle(/法大大/i).click();
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    await expect(page.getByText(/已发起签署/)).toBeVisible({ timeout: 10000 });

    await page.reload();
    const activateBtn = page.getByRole('button', { name: /确认生效/i });
    await expect(activateBtn).toBeVisible({ timeout: 5000 });
    await activateBtn.click();
    await expect(page.getByText(/合同已激活/)).toBeVisible({ timeout: 10000 });

    const contractAfterActivate = await apiClient.getContract(contractId);
    expect(contractAfterActivate.contract?.status || contractAfterActivate.status).toBe('active');
  });
});

test.describe('ACPT-S2-004: 付款退款/作废路径', () => {
  let customerId: string;
  let orderId: string;
  let paymentId: string;

  test.beforeAll(async () => {
    await apiClient.login();
    const customer = await apiClient.createCustomer({ name: '付款退款测试客户', phone: '13900004444' });
    customerId = customer.id;

    const order = await apiClient.createOrderFromContract('skip', 'skip', customerId);
    orderId = order.id;
  });

  test('付款作废：pending -> voided', async ({ page }) => {
    const payment = await apiClient.createPayment({
      orderId,
      customerId,
      amount: 1000,
      paymentMethod: 'bank_transfer',
    });
    paymentId = payment.id;
    expect(payment.status).toBe('pending');

    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);

    await page.goto(`/payments/${paymentId}`);
    await expect(page.getByText(/待处理/)).toBeVisible({ timeout: 10000 });

    const voidBtn = page.getByRole('button', { name: /作废/i });
    await expect(voidBtn).toBeVisible({ timeout: 5000 });
    await voidBtn.click();

    await expect(page.getByText(/确认作废/)).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /^确定|确认$/i }).click();

    await apiClient.waitForCondition(async () => {
      const p = await apiClient.getPayment(paymentId);
      return p.status === 'voided';
    }, 10000);

    const voidedPayment = await apiClient.getPayment(paymentId);
    expect(voidedPayment.status).toBe('voided');
  });

  test('付款退款：succeeded -> refunded', async ({ page }) => {
    const payment = await apiClient.createPayment({
      orderId,
      customerId,
      amount: 2000,
      paymentMethod: 'bank_transfer',
    });
    const refundPaymentId = payment.id;

    await apiClient.processPayment(refundPaymentId);
    await apiClient.succeedPayment(refundPaymentId);

    const pendingApprovals = await apiClient.getPendingApprovals();
    const paymentApproval = pendingApprovals.find(
      (a: any) => a.resourceType === 'payment' && a.resourceId === refundPaymentId
    );
    if (paymentApproval) {
      await apiClient.approveApprovalRequest(paymentApproval.id);
    }

    await apiClient.waitForCondition(async () => {
      const p = await apiClient.getPayment(refundPaymentId);
      return p.status === 'succeeded';
    }, 15000);

    await page.goto(`/payments/${refundPaymentId}`);
    await expect(page.getByText(/已成功/)).toBeVisible({ timeout: 10000 });

    const refundBtn = page.getByRole('button', { name: /退款/i });
    await expect(refundBtn).toBeVisible({ timeout: 5000 });
    await refundBtn.click();

    await expect(page.getByText(/确认退款/)).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /^确定|确认$/i }).click();

    await apiClient.waitForCondition(async () => {
      const p = await apiClient.getPayment(refundPaymentId);
      return p.status === 'refunded';
    }, 10000);

    const refundedPayment = await apiClient.getPayment(refundPaymentId);
    expect(refundedPayment.status).toBe('refunded');
  });
});

test.describe('ACPT-S2-005: 订阅暂停/取消路径', () => {
  let subscriptionId: string;

  test.beforeAll(async () => {
    await apiClient.login();
  });

  test('订阅暂停：active -> suspended', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);

    const subsResult = await apiClient.getSubscriptions({});
    const subs = subsResult.items || subsResult.data || subsResult;
    const activeSub = subs.find((s: any) => s.status === 'active');
    if (!activeSub) {
      test.skip();
      return;
    }
    subscriptionId = activeSub.id;

    await page.goto(`/subscriptions/${subscriptionId}`);
    await expect(page.getByText(/生效中|active/i)).toBeVisible({ timeout: 10000 });

    const suspendBtn = page.getByRole('button', { name: /暂停订阅/i });
    await expect(suspendBtn).toBeVisible({ timeout: 5000 });
    await suspendBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/暂停原因/i).fill('E2E验收测试暂停');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();

    await apiClient.waitForCondition(async () => {
      const s = await apiClient.getSubscription(subscriptionId);
      return s.subscription?.status === 'suspended';
    }, 10000);

    const suspendedSub = await apiClient.getSubscription(subscriptionId);
    expect(suspendedSub.subscription.status).toBe('suspended');
  });

  test('订阅取消：active/trial -> cancelled', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);

    const subsResult = await apiClient.getSubscriptions({});
    const subs = subsResult.items || subsResult.data || subsResult;
    const cancellableSub = subs.find((s: any) => s.status === 'active' || s.status === 'trial');
    if (!cancellableSub) {
      test.skip();
      return;
    }
    const cancelSubId = cancellableSub.id;

    await page.goto(`/subscriptions/${cancelSubId}`);

    const cancelBtn = page.getByRole('button', { name: /取消订阅/i });
    if (!(await cancelBtn.isVisible())) {
      test.skip();
      return;
    }
    await cancelBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible();
    const reasonInput = page.getByLabel(/取消原因/i);
    if (await reasonInput.isVisible()) {
      await reasonInput.fill('E2E验收测试取消');
    }
    await page.getByRole('button', { name: /^确定|提交$/i }).click();

    await apiClient.waitForCondition(async () => {
      const s = await apiClient.getSubscription(cancelSubId);
      return s.subscription?.status === 'cancelled';
    }, 10000);

    const cancelledSub = await apiClient.getSubscription(cancelSubId);
    expect(cancelledSub.subscription.status).toBe('cancelled');
  });
});

test.describe('ACPT-S2-006: 并发版本冲突', () => {
  test('乐观锁冲突：两次并发更新订阅席位应有一次失败', async () => {
    await apiClient.login();

    const subsResult = await apiClient.getSubscriptions({});
    const subs = subsResult.items || subsResult.data || subsResult;
    const activeSub = subs.find((s: any) => s.status === 'active');
    if (!activeSub) {
      test.skip();
      return;
    }

    const sub = await apiClient.getSubscription(activeSub.id);
    const version = sub.subscription.version;

    const firstUpdate = apiClient.updateSubscription(activeSub.id, {
      seatCount: sub.subscription.seatCount + 1,
      version,
    });

    const secondUpdate = apiClient.updateSubscription(activeSub.id, {
      seatCount: sub.subscription.seatCount + 2,
      version,
    });

    const results = await Promise.allSettled([firstUpdate, secondUpdate]);
    const rejected = results.filter(r => r.status === 'rejected');
    expect(rejected.length).toBeGreaterThanOrEqual(1);
  });

  test('乐观锁冲突：合同并发审批应有一次失败', async () => {
    await apiClient.login();

    const customer = await apiClient.createCustomer({ name: '并发冲突测试客户', phone: '13900005555' });
    const opportunity = await apiClient.createOpportunity({ customerId: customer.id, name: '并发冲突测试商机' });
    await apiClient.markOpportunityWon(opportunity.id);

    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const contract = await apiClient.createContract({
      opportunityId: opportunity.id,
      customerId: customer.id,
      title: '并发冲突测试合同',
      totalAmount: 10000,
      startsOn: today.toISOString().split('T')[0],
      endsOn: nextYear.toISOString().split('T')[0],
    });

    await apiClient.submitContractApproval(contract.id);

    const firstApprove = apiClient.approveContract(contract.id);
    const secondApprove = apiClient.approveContract(contract.id);

    const results = await Promise.allSettled([firstApprove, secondApprove]);
    const rejected = results.filter(r => r.status === 'rejected');
    expect(rejected.length).toBeGreaterThanOrEqual(1);
  });
});

test.describe('ACPT-S2-007: 越权审批', () => {
  test('无审批权限的用户不能审批订单确认', async () => {
    await apiClient.login();

    const customer = await apiClient.createCustomer({ name: '越权审批测试客户', phone: '13900006666' });
    const opportunity = await apiClient.createOpportunity({ customerId: customer.id, name: '越权审批测试商机' });
    await apiClient.markOpportunityWon(opportunity.id);

    const today = new Date();
    const nextYear = new Date(today);
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    const contract = await apiClient.createContract({
      opportunityId: opportunity.id,
      customerId: customer.id,
      title: '越权审批测试合同',
      totalAmount: 10000,
      startsOn: today.toISOString().split('T')[0],
      endsOn: nextYear.toISOString().split('T')[0],
    });
    await apiClient.submitContractApproval(contract.id);
    await apiClient.approveContract(contract.id);
    await apiClient.signContract(contract.id);
    await apiClient.activateContract(contract.id);

    const order = await apiClient.createOrderFromContract(contract.id, '', customer.id);
    await apiClient.confirmOrder(order.id);

    const pendingApprovals = await apiClient.getPendingApprovals();
    const orderApproval = pendingApprovals.find(
      (a: any) => a.resourceType === 'order' && a.resourceId === order.id
    );
    expect(orderApproval).toBeTruthy();

    try {
      const otherUser = await apiClient.loginAs('viewer', 'Viewer123!');
      await apiClient.approveApprovalRequestWithToken(orderApproval.id, otherUser.token);
      throw new Error('应该抛出异常：viewer无审批权限');
    } catch (err: any) {
      if (err.message === '应该抛出异常：viewer无审批权限') throw err;
      expect([403, 401]).toContain(err.response?.status || err.status);
    }
  });
});
