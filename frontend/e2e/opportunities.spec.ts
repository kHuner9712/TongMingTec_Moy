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
    await expect(page.getByRole('heading', { name: /商机/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /新建商机/i })).toBeVisible();
  });

  test('打开新建商机对话框', async ({ page }) => {
    await page.getByRole('button', { name: /新建商机/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByLabel(/商机名称/i)).toBeVisible();
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
    
    await expect(page.getByRole('dialog')).toBeVisible();
  });

  test('推进商机阶段', async ({ page }) => {
    const firstOpportunity = page.getByRole('row').nth(1);
    await firstOpportunity.getByRole('button', { name: /推进/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    
    await expect(page.getByText('阶段推进成功')).toBeVisible();
  });

  test('标记商机结果', async ({ page }) => {
    const firstOpportunity = page.getByRole('row').nth(1);
    await firstOpportunity.getByRole('button', { name: /结果/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('combobox').click();
    await page.getByRole('option', { name: /赢单/i }).click();
    await page.getByRole('button', { name: /^确定|提交$/i }).click();
    
    await expect(page.getByText('结果标记成功')).toBeVisible();
  });

  test('显示商机阶段步骤', async ({ page }) => {
    const firstOpportunity = page.getByRole('row').nth(1);
    await firstOpportunity.getByRole('button', { name: /详情/i }).click();
    
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/发现|验证/i)).toBeVisible();
  });
});
