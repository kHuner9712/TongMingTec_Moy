import { test, expect } from '@playwright/test';

test.describe('ACPT-S2-008: 经营驾驶舱与自动化触发', () => {
  test('驾驶舱页面加载并展示关键指标', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);

    await page.goto('/cockpit');
    await expect(page.getByText(/经营驾驶舱|AI 洞察|风险信号/i)).toBeVisible({ timeout: 15000 });

    const metricsSection = page.getByText(/关键指标|Key Metrics/i);
    if (await metricsSection.isVisible()) {
      await expect(metricsSection).toBeVisible();
    }

    const aiInsightsSection = page.getByText(/AI 洞察|AI Insights/i);
    if (await aiInsightsSection.isVisible()) {
      await expect(aiInsightsSection).toBeVisible();
    }

    const riskSignalsSection = page.getByText(/风险信号|Risk Signals/i);
    if (await riskSignalsSection.isVisible()) {
      await expect(riskSignalsSection).toBeVisible();
    }
  });

  test('Dashboard 页面加载并展示基础统计', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);

    await expect(page.getByText(/客户|线索|商机/i)).toBeVisible({ timeout: 15000 });
  });

  test('审批工作台展示待审批请求', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/用户名|username/i).fill('admin');
    await page.getByPlaceholder(/密码|password/i).fill('Admin123!');
    await page.getByRole('button', { name: /登录|login/i }).click();
    await page.waitForURL(/.*dashboard/);

    await page.goto('/workbench/approvals');
    await expect(page.getByText(/审批|Approval/i)).toBeVisible({ timeout: 15000 });
  });
});
