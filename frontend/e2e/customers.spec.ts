import { test, expect } from '@playwright/test';

test.describe('客户管理', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);
    await page.goto('/customers');
  });

  test('显示客户列表页面', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /客户/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /新建客户/i })).toBeVisible();
  });

  test('打开新建客户对话框', async ({ page }) => {
    await page.getByRole('button', { name: /新建客户/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/客户名称/i)).toBeVisible();
  });

  test('创建新客户', async ({ page }) => {
    await page.getByRole('button', { name: /新建客户/i }).click();
    
    await page.getByLabel(/客户名称/i).fill('测试客户E2E');
    await page.getByLabel(/行业/i).fill('软件');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    
    await expect(page.getByText('创建成功')).toBeVisible();
    await expect(page.getByText('测试客户E2E')).toBeVisible();
  });

  test('筛选客户列表', async ({ page }) => {
    const statusFilter = page.getByRole('combobox').first();
    await statusFilter.click();
    await page.getByRole('option', { name: /活跃/i }).click();
    
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('查看客户详情', async ({ page }) => {
    const firstCustomer = page.getByRole('row').nth(1);
    await firstCustomer.getByRole('button', { name: /详情/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('编辑客户', async ({ page }) => {
    const firstCustomer = page.getByRole('row').nth(1);
    await firstCustomer.getByRole('button', { name: /编辑/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel(/行业/i).fill('更新后的行业');
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    
    await expect(page.getByText('更新成功')).toBeVisible();
  });

  test('变更客户状态', async ({ page }) => {
    const firstCustomer = page.getByRole('row').nth(1);
    await firstCustomer.getByRole('button', { name: /状态/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /沉睡/i }).click();
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    
    await expect(page.getByText('状态变更成功')).toBeVisible();
  });
});
