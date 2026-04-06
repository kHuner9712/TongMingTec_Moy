import { test, expect } from '@playwright/test';

test.describe('登录流程', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('显示登录表单', async ({ page }) => {
    await expect(page.getByPlaceholder(/用户名|username/i)).toBeVisible();
    await expect(page.getByPlaceholder(/密码|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /登录|login/i })).toBeVisible();
  });

  test('登录失败显示错误信息', async ({ page }) => {
    await page.getByPlaceholder(/用户名|username/i).fill('wronguser');
    await page.getByPlaceholder(/密码|password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /登录|login/i }).click();
    
    await expect(page.getByText(/用户名或密码错误|invalid/i)).toBeVisible();
  });

  test('登录成功跳转到仪表盘', async ({ page }) => {
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('表单验证 - 空用户名', async ({ page }) => {
    await page.getByPlaceholder(/密码|password/i).fill('password');
    await page.getByRole('button', { name: /登录|login/i }).click();
    
    await expect(page.getByText(/请输入用户名|required/i)).toBeVisible();
  });

  test('表单验证 - 空密码', async ({ page }) => {
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByRole('button', { name: /登录|login/i }).click();
    
    await expect(page.getByText(/请输入密码|required/i)).toBeVisible();
  });
});
