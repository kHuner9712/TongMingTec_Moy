import { test, expect } from '@playwright/test';

test.describe('工单管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);
    await page.goto('/tickets');
  });

  test('显示工单列表页面', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /工单/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /新建工单/i })).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('打开新建工单对话框', async ({ page }) => {
    await page.getByRole('button', { name: /新建工单/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/新建工单/i)).toBeVisible();
    await expect(page.getByLabel(/标题/i)).toBeVisible();
  });

  test('状态筛选功能', async ({ page }) => {
    const statusFilter = page.getByPlaceholder('状态筛选');
    await statusFilter.click();
    await page.getByRole('option', { name: /待处理/i }).click();
    
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('优先级筛选功能', async ({ page }) => {
    const priorityFilter = page.getByPlaceholder('优先级筛选');
    await priorityFilter.click();
    await page.getByRole('option', { name: /紧急/i }).click();
    
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('查看工单详情', async ({ page }) => {
    const firstTicket = page.getByRole('row').nth(1);
    const detailButton = firstTicket.getByRole('button', { name: /详情/i });
    
    if (await detailButton.isVisible()) {
      await detailButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/工单详情/i)).toBeVisible();
    }
  });

  test('分配工单操作', async ({ page }) => {
    const statusFilter = page.getByPlaceholder('状态筛选');
    await statusFilter.click();
    await page.getByRole('option', { name: /待处理/i }).click();
    
    await page.waitForTimeout(500);
    
    const firstTicket = page.getByRole('row').nth(1);
    const assignButton = firstTicket.getByRole('button', { name: /分配/i });
    
    if (await assignButton.isVisible()) {
      await assignButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/分配工单/i)).toBeVisible();
    }
  });

  test('开始处理工单操作', async ({ page }) => {
    const statusFilter = page.getByPlaceholder('状态筛选');
    await statusFilter.click();
    await page.getByRole('option', { name: /已分配/i }).click();
    
    await page.waitForTimeout(500);
    
    const firstTicket = page.getByRole('row').nth(1);
    const startButton = firstTicket.getByRole('button', { name: /开始/i });
    
    if (await startButton.isVisible()) {
      await startButton.click();
    }
  });

  test('解决工单操作', async ({ page }) => {
    const statusFilter = page.getByPlaceholder('状态筛选');
    await statusFilter.click();
    await page.getByRole('option', { name: /处理中/i }).click();
    
    await page.waitForTimeout(500);
    
    const firstTicket = page.getByRole('row').nth(1);
    const resolveButton = firstTicket.getByRole('button', { name: /解决/i });
    
    if (await resolveButton.isVisible()) {
      await resolveButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/标记为已解决/i)).toBeVisible();
    }
  });

  test('关闭工单操作', async ({ page }) => {
    const statusFilter = page.getByPlaceholder('状态筛选');
    await statusFilter.click();
    await page.getByRole('option', { name: /已解决/i }).click();
    
    await page.waitForTimeout(500);
    
    const firstTicket = page.getByRole('row').nth(1);
    const closeButton = firstTicket.getByRole('button', { name: /关闭/i });
    
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/关闭工单/i)).toBeVisible();
    }
  });
});
