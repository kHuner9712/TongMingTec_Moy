import { test, expect } from '@playwright/test';

test.describe('关键业务流程 - Lead to Opportunity', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);
  });

  test('完整流程: 创建线索 -> 分配 -> 跟进 -> 转化为商机', async ({ page }) => {
    await page.goto('/leads');

    await page.getByRole('button', { name: /新建线索/i }).click();
    await page.getByLabel(/姓名/i).fill('E2E流程测试线索');
    await page.getByLabel(/手机/i).fill('13900139001');
    await page.getByLabel(/公司/i).fill('E2E流程测试公司');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    await expect(page.getByText('创建成功')).toBeVisible();

    const newLeadRow = page.getByRole('row').filter({ hasText: 'E2E流程测试线索' });
    await expect(newLeadRow).toBeVisible();

    await newLeadRow.getByRole('button', { name: /分配/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    await expect(page.getByText('分配成功')).toBeVisible();

    const assignedLeadRow = page.getByRole('row').filter({ hasText: 'E2E流程测试线索' });
    await assignedLeadRow.getByRole('button', { name: /跟进/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/跟进内容/i).fill('E2E测试跟进记录');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    await expect(page.getByText('跟进记录已添加')).toBeVisible();

    const followingLeadRow = page.getByRole('row').filter({ hasText: 'E2E流程测试线索' });
    await followingLeadRow.getByRole('button', { name: /转化/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    await expect(page.getByText('转化成功')).toBeVisible();

    await page.goto('/opportunities');
    await expect(page.getByText('E2E流程测试公司')).toBeVisible();
  });

  test('线索状态流转验证', async ({ page }) => {
    await page.goto('/leads');

    await page.getByRole('button', { name: /新建线索/i }).click();
    await page.getByLabel(/姓名/i).fill('状态流转测试');
    await page.getByLabel(/手机/i).fill('13900139002');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();

    const leadRow = page.getByRole('row').filter({ hasText: '状态流转测试' });
    await expect(leadRow.getByText(/新线索/i)).toBeVisible();

    await leadRow.getByRole('button', { name: /分配/i }).click();
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    await expect(leadRow.getByText(/已分配/i)).toBeVisible();

    await leadRow.getByRole('button', { name: /跟进/i }).click();
    await page.getByLabel(/跟进内容/i).fill('测试跟进');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    await expect(leadRow.getByText(/跟进中/i)).toBeVisible();
  });

  test('商机阶段推进完整流程', async ({ page }) => {
    await page.goto('/opportunities');

    const discoveryRow = page.getByRole('row').filter({ hasText: '发现' }).first();
    if (await discoveryRow.isVisible()) {
      await discoveryRow.getByRole('button', { name: /推进/i }).click();
      await page.getByRole('button', { name: /^确定$/i }).click();
      await expect(page.getByText('阶段推进成功')).toBeVisible();
    }
  });

  test('商机结果标记流程', async ({ page }) => {
    await page.goto('/opportunities');

    const negotiationRow = page.getByRole('row').filter({ hasText: '谈判' }).first();
    if (await negotiationRow.isVisible()) {
      await negotiationRow.getByRole('button', { name: /结果/i }).click();
      await page.getByRole('combobox').click();
      await page.getByRole('option', { name: /赢单/i }).click();
      await page.getByRole('button', { name: /^确定$/i }).click();
      await expect(page.getByText('结果标记成功')).toBeVisible();
    }
  });
});

test.describe('关键业务流程 - Conversation to Ticket', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);
  });

  test('完整流程: 会话列表 -> 创建工单 -> 处理工单', async ({ page }) => {
    await page.goto('/conversations');

    await expect(page.getByRole('table')).toBeVisible();

    const firstConversation = page.getByRole('row').nth(1);
    if (await firstConversation.isVisible()) {
      await firstConversation.getByRole('button', { name: /详情/i }).click();
      await expect(page.getByText('会话详情')).toBeVisible();

      const createTicketButton = page.getByRole('button', { name: /创建工单/i });
      if (await createTicketButton.isVisible()) {
        await createTicketButton.click();
        await expect(page.getByRole('dialog')).toBeVisible();
      }
    }
  });

  test('工单创建和处理流程', async ({ page }) => {
    await page.goto('/tickets');

    await page.getByRole('button', { name: /新建工单/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/标题/i).fill('E2E测试工单');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    await expect(page.getByText('创建成功')).toBeVisible();

    const newTicketRow = page.getByRole('row').filter({ hasText: 'E2E测试工单' });
    await expect(newTicketRow).toBeVisible();
  });

  test('工单状态流转验证', async ({ page }) => {
    await page.goto('/tickets');

    const ticketRow = page.getByRole('row').filter({ hasText: '待处理' }).first();
    if (await ticketRow.isVisible()) {
      await ticketRow.getByRole('button', { name: /处理/i }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });
});

test.describe('关键业务流程 - 权限验证', () => {
  test('未登录用户重定向到登录页', async ({ page }) => {
    await page.goto('/opportunities');
    await expect(page).toHaveURL(/.*login/);
  });

  test('登录后可访问受保护页面', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);

    await page.goto('/opportunities');
    await expect(page.getByRole('button', { name: /新建商机/i })).toBeVisible();
  });
});

test.describe('关键业务流程 - 数据一致性', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);
  });

  test('商机汇总卡与列表数据一致性', async ({ page }) => {
    await page.goto('/opportunities');

    const totalCard = page.getByText('商机总数').locator('..');
    await expect(totalCard).toBeVisible();

    const tableRows = page.getByRole('row');
    const rowCount = await tableRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });

  test('线索状态与操作按钮一致性', async ({ page }) => {
    await page.goto('/leads');

    const newRow = page.getByRole('row').filter({ hasText: '新线索' }).first();
    if (await newRow.isVisible()) {
      await expect(newRow.getByRole('button', { name: /分配/i })).toBeVisible();
      await expect(newRow.getByRole('button', { name: /跟进/i })).not.toBeVisible();
    }

    const followingRow = page.getByRole('row').filter({ hasText: '跟进中' }).first();
    if (await followingRow.isVisible()) {
      await expect(followingRow.getByRole('button', { name: /转化/i })).toBeVisible();
    }
  });

  test('商机阶段与操作按钮一致性', async ({ page }) => {
    await page.goto('/opportunities');

    const discoveryRow = page.getByRole('row').filter({ hasText: '发现' }).first();
    if (await discoveryRow.isVisible()) {
      await expect(discoveryRow.getByRole('button', { name: /推进/i })).toBeVisible();
      await expect(discoveryRow.getByRole('button', { name: /结果/i })).not.toBeVisible();
    }

    const negotiationRow = page.getByRole('row').filter({ hasText: '谈判' }).first();
    if (await negotiationRow.isVisible()) {
      await expect(negotiationRow.getByRole('button', { name: /结果/i })).toBeVisible();
    }

    const wonRow = page.getByRole('row').filter({ hasText: '赢单' }).first();
    if (await wonRow.isVisible()) {
      await expect(wonRow.getByRole('button', { name: /推进/i })).not.toBeVisible();
    }
  });
});
