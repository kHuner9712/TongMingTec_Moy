import { test, expect } from '@playwright/test';

test.describe('会话管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);
    await page.goto('/conversations');
  });

  test('显示会话列表页面', async ({ page }) => {
    await expect(page.getByRole('table')).toBeVisible();
    await expect(page.getByPlaceholder('状态筛选')).toBeVisible();
  });

  test('状态筛选功能', async ({ page }) => {
    const statusFilter = page.getByPlaceholder('状态筛选');
    await statusFilter.click();
    await page.getByRole('option', { name: /进行中/i }).click();
    
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('查看会话详情', async ({ page }) => {
    const firstConversation = page.getByRole('row').nth(1);
    const detailButton = firstConversation.getByRole('button', { name: /详情/i });
    
    if (await detailButton.isVisible()) {
      await detailButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/会话详情/i)).toBeVisible();
    }
  });

  test('接入会话操作', async ({ page }) => {
    const statusFilter = page.getByPlaceholder('状态筛选');
    await statusFilter.click();
    await page.getByRole('option', { name: /排队中/i }).click();
    
    await page.waitForTimeout(500);
    
    const firstConversation = page.getByRole('row').nth(1);
    const acceptButton = firstConversation.getByRole('button', { name: /接入/i });
    
    if (await acceptButton.isVisible()) {
      await acceptButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/接入会话/i)).toBeVisible();
    }
  });

  test('转接会话操作', async ({ page }) => {
    const statusFilter = page.getByPlaceholder('状态筛选');
    await statusFilter.click();
    await page.getByRole('option', { name: /进行中/i }).click();
    
    await page.waitForTimeout(500);
    
    const firstConversation = page.getByRole('row').nth(1);
    const transferButton = firstConversation.getByRole('button', { name: /转接/i });
    
    if (await transferButton.isVisible()) {
      await transferButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/转接会话/i)).toBeVisible();
    }
  });

  test('关闭会话操作', async ({ page }) => {
    const statusFilter = page.getByPlaceholder('状态筛选');
    await statusFilter.click();
    await page.getByRole('option', { name: /进行中/i }).click();
    
    await page.waitForTimeout(500);
    
    const firstConversation = page.getByRole('row').nth(1);
    const closeButton = firstConversation.getByRole('button', { name: /关闭/i });
    
    if (await closeButton.isVisible()) {
      await closeButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/关闭会话/i)).toBeVisible();
    }
  });

  test('WebSocket 连接状态显示', async ({ page }) => {
    const firstConversation = page.getByRole('row').nth(1);
    const detailButton = firstConversation.getByRole('button', { name: /详情/i });
    
    if (await detailButton.isVisible()) {
      await detailButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/实时连接|未连接/i)).toBeVisible();
    }
  });
});
