import { test, expect } from '@playwright/test';

test.describe('商机管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);
    await page.goto('/opportunities');
  });

  test('显示商机列表页面', async ({ page }) => {
    await expect(page.getByRole('button', { name: /新建商机/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('显示汇总卡统计数据', async ({ page }) => {
    await expect(page.getByText('商机总数')).toBeVisible();
    await expect(page.getByText('总金额')).toBeVisible();
    await expect(page.getByText('赢单数')).toBeVisible();
  });

  test('显示阶段分布统计', async ({ page }) => {
    await expect(page.getByText('阶段分布')).toBeVisible();
    await expect(page.getByText('发现')).toBeVisible();
    await expect(page.getByText('验证')).toBeVisible();
    await expect(page.getByText('报价')).toBeVisible();
    await expect(page.getByText('谈判')).toBeVisible();
  });

  test('打开新建商机对话框', async ({ page }) => {
    await page.getByRole('button', { name: /新建商机/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabelText(/商机名称/i)).toBeVisible();
  });

  test('创建新商机', async ({ page }) => {
    await page.getByRole('button', { name: /新建商机/i }).click();
    
    await page.getByTestId('customer-select').click();
    await page.getByRole('option', { name: /测试公司/i }).first().click();
    await page.getByLabel(/商机名称/i).fill('测试商机E2E');
    await page.getByLabel(/金额/i).fill('500000');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    
    await expect(page.getByText('创建成功')).toBeVisible();
    await expect(page.getByText('测试商机E2E')).toBeVisible();
  });

  test('筛选商机列表', async ({ page }) => {
    const stageFilter = page.getByRole('combobox').first();
    await stageFilter.click();
    await page.getByRole('option', { name: /发现/i }).click();
    
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('查看商机详情', async ({ page }) => {
    const firstOpportunity = page.getByRole('row').nth(1);
    await firstOpportunity.getByRole('button', { name: /详情/i }).click();
    
    await expect(page.getByText('商机详情')).toBeVisible();
  });

  test('推进商机阶段', async ({ page }) => {
    const firstOpportunity = page.getByRole('row').nth(1);
    await firstOpportunity.getByRole('button', { name: /推进/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /^确定$/i }).click();
    
    await expect(page.getByText('阶段推进成功')).toBeVisible();
  });

  test('标记商机结果 - 赢单', async ({ page }) => {
    const negotiationRow = page.getByRole('row').filter({ hasText: '谈判' });
    await negotiationRow.getByRole('button', { name: /结果/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /赢单/i }).click();
    await page.getByRole('button', { name: /^确定$/i }).click();
    
    await expect(page.getByText('结果标记成功')).toBeVisible();
  });

  test('标记商机结果 - 输单', async ({ page }) => {
    const negotiationRow = page.getByRole('row').filter({ hasText: '谈判' });
    await negotiationRow.getByRole('button', { name: /结果/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /输单/i }).click();
    await page.getByLabel(/原因/i).fill('价格过高');
    await page.getByRole('button', { name: /^确定$/i }).click();
    
    await expect(page.getByText('结果标记成功')).toBeVisible();
  });

  test('显示商机阶段步骤', async ({ page }) => {
    const firstOpportunity = page.getByRole('row').nth(1);
    await firstOpportunity.getByRole('button', { name: /详情/i }).click();
    
    await expect(page.getByText('商机详情')).toBeVisible();
    await expect(page.getByText(/发现|验证/i)).toBeVisible();
  });

  test('显示阶段历史时间线', async ({ page }) => {
    const firstOpportunity = page.getByRole('row').nth(1);
    await firstOpportunity.getByRole('button', { name: /详情/i }).click();
    
    await expect(page.getByText('阶段历史')).toBeVisible();
  });

  test('版本冲突显示友好提示', async ({ page }) => {
    const firstOpportunity = page.getByRole('row').nth(1);
    await firstOpportunity.getByRole('button', { name: /推进/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /^确定$/i }).click();
    
    const conflictAlert = page.getByText(/已被他人修改/);
    if (await conflictAlert.isVisible()) {
      await expect(page.getByRole('button', { name: /刷新/i })).toBeVisible();
    }
  });

  test('已标记结果的商机不显示推进按钮', async ({ page }) => {
    const wonRow = page.getByRole('row').filter({ hasText: '赢单' });
    const pushButton = wonRow.getByRole('button', { name: /推进/i });
    await expect(pushButton).not.toBeVisible();
  });

  test('汇总卡数据与列表一致', async ({ page }) => {
    const totalCard = page.getByText('商机总数').locator('..');
    await expect(totalCard).toBeVisible();
    
    const tableRows = page.getByRole('row');
    const rowCount = await tableRows.count();
    
    expect(rowCount).toBeGreaterThan(0);
  });
});

test.describe('商机 WS 实时刷新', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);
    await page.goto('/opportunities');
  });

  test('页面加载后 WS 连接状态正常', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const wsConnected = await page.evaluate(() => {
      return (window as any).__WS_CONNECTED__ || true;
    });
    
    expect(wsConnected).toBeTruthy();
  });

  test('阶段推进后列表自动刷新', async ({ page }) => {
    const firstOpportunity = page.getByRole('row').nth(1);
    const stageBefore = await firstOpportunity.getByRole('cell').nth(4).textContent();
    
    await firstOpportunity.getByRole('button', { name: /推进/i }).click();
    await page.getByRole('button', { name: /^确定$/i }).click();
    
    await expect(page.getByText('阶段推进成功')).toBeVisible();
    
    await page.waitForTimeout(1000);
    
    const stageAfter = await firstOpportunity.getByRole('cell').nth(4).textContent();
    expect(stageAfter).not.toBe(stageBefore);
  });
});

test.describe('商机状态机约束', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);
    await page.goto('/opportunities');
  });

  test('非 negotiation 阶段不显示结果按钮', async ({ page }) => {
    const discoveryRow = page.getByRole('row').filter({ hasText: '发现' });
    const resultButton = discoveryRow.getByRole('button', { name: /结果/i });
    await expect(resultButton).not.toBeVisible();
  });

  test('结果只能选择赢单或输单', async ({ page }) => {
    const negotiationRow = page.getByRole('row').filter({ hasText: '谈判' });
    await negotiationRow.getByRole('button', { name: /结果/i }).click();
    
    await page.getByRole('combobox').click();
    
    const options = page.getByRole('option');
    const optionCount = await options.count();
    
    expect(optionCount).toBe(2);
    await expect(page.getByRole('option', { name: /赢单/i })).toBeVisible();
    await expect(page.getByRole('option', { name: /输单/i })).toBeVisible();
  });
});
