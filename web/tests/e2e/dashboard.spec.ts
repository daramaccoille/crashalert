import { test, expect } from '@playwright/test';

test.describe('Dashboard Tests', () => {
  test.beforeEach(async ({ context }) => {
    // Add the cookie expected by the middleware to allow entry
    await context.addCookies([
      {
        name: 'crashalert-user',
        value: 'mock-user',
        domain: 'localhost',
        path: '/',
      }
    ]);
  });

  test('Dashboard page loads correctly', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/.*\/dashboard/);
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
  });

  test('Manage Subscription button behaves correctly', async ({ page }) => {
    // Mock the metrics endpoints so dashboard renders
    await page.route('/api/metrics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vix: 15,
          yieldSpread: 1.5,
          sp500pe: 20,
          liquidity: 6,
          junkBondSpread: 400,
          marketMode: 'BULL',
          oecdValue: '100',
          oecdMomentum: '0.5',
          oecdTrend: 'improving',
          createdAt: new Date().toISOString()
        })
      });
    });

    await page.route('/api/metrics/history', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });

    // Provide a mocked delayed response for /api/portal so we can observe the loading state
    await page.route('/api/portal', async route => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: 'javascript:void(0)' })
      });
    });

    await page.goto('/dashboard');
    
    const manageSubscriptionBtn = page.getByRole('button', { name: /manage subscription|redirecting/i });
    
    await expect(manageSubscriptionBtn).toBeVisible();
    await expect(manageSubscriptionBtn).toBeEnabled();
    await expect(manageSubscriptionBtn).toHaveClass(/cursor-pointer/);
    
    // Click and expect the transition to the loading state
    await manageSubscriptionBtn.click();
    await expect(manageSubscriptionBtn).toBeDisabled();
    await expect(manageSubscriptionBtn).toHaveText(/Redirecting/);
    await expect(manageSubscriptionBtn).toHaveClass(/cursor-wait/);
  });
});
