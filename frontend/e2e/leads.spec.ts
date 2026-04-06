import { test, expect } from '@playwright/test';

test.describe('线索管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);
    await page.goto('/leads');
  });

  test('显示线索列表页面', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /线索/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /新建线索/i })).toBeVisible();
  });

  test('打开新建线索对话框', async ({ page }) => {
    await page.getByRole('button', { name: /新建线索/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/姓名/i)).toBeVisible();
  });

  test('创建新线索', async ({ page }) => {
    await page.getByRole('button', { name: /新建线索/i }).click();
    
    await page.getByLabel(/姓名/i).fill('测试线索E2E');
    await page.getByLabel(/手机/i).fill('13900139000');
    await page.getByLabel(/公司/i).fill('E2E测试公司');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    
    await expect(page.getByText('创建成功')).toBeVisible();
    await expect(page.getByText('测试线索E2E')).toBeVisible();
  });

  test('筛选线索列表', async ({ page }) => {
    const statusFilter = page.getByRole('combobox').first();
    await statusFilter.click();
    await page.getByRole('option', { name: /新线索/i }).click();
    
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('查看线索详情', async ({ page }) => {
    const firstLead = page.getByRole('row').nth(1);
    await firstLead.getByRole('button', { name: /详情/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('分配线索', async ({ page }) => {
    const firstLead = page.getByRole('row').nth(1);
    await firstLead.getByRole('button', { name: /分配/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('添加跟进记录', async ({ page }) => {
    const firstLead = page.getByRole('row').nth(1);
    await firstLead.getByRole('button', { name: /跟进/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/跟进内容/i).fill('测试跟进记录');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    
    await expect(page.getByText('跟进记录已添加')).toBeVisible();
  });

  test('转化线索为商机', async ({ page }) => {
    const followingLead = page.getByRole('row').filter({ hasText: '跟进中' }).first();
    await followingLead.getByRole('button', { name: /转化/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    
    await expect(page.getByText('转化成功')).toBeVisible();
  });
});
