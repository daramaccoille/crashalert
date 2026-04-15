# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard Tests >> Manage Subscription button behaves correctly
- Location: tests\e2e\dashboard.spec.ts:18:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('button', { name: /manage subscription|redirecting/i })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByRole('button', { name: /manage subscription|redirecting/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]: Loading Market Data...
  - status [ref=e3]:
    - generic [ref=e4]:
      - img [ref=e6]
      - generic [ref=e8]:
        - text: Static route
        - button "Hide static indicator" [ref=e9] [cursor=pointer]:
          - img [ref=e10]
  - alert [ref=e13]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Dashboard Tests', () => {
  4  |   test.beforeEach(async ({ context }) => {
  5  |     // Inject header for middleware to allow generic bypassing locally
  6  |     await context.setExtraHTTPHeaders({
  7  |        'x-playwright-test': 'true'
  8  |     });
  9  |   });
  10 | 
  11 |   test('Dashboard page loads correctly', async ({ page }) => {
  12 |     await page.goto('/dashboard');
  13 |     await expect(page).toHaveURL(/.*\/dashboard/);
  14 |     const bodyText = await page.textContent('body');
  15 |     expect(bodyText).toBeTruthy();
  16 |   });
  17 | 
  18 |   test('Manage Subscription button behaves correctly', async ({ page }) => {
  19 |     // Mock the metrics endpoints so dashboard renders
  20 |     await page.route('/api/metrics', async route => {
  21 |       await route.fulfill({
  22 |         status: 200,
  23 |         contentType: 'application/json',
  24 |         body: JSON.stringify({
  25 |           vix: 15,
  26 |           yieldSpread: 1.5,
  27 |           sp500pe: 20,
  28 |           liquidity: 6,
  29 |           junkBondSpread: 400,
  30 |           marketMode: 'BULL',
  31 |           oecdValue: '100',
  32 |           oecdMomentum: '0.5',
  33 |           oecdTrend: 'improving',
  34 |           createdAt: new Date().toISOString()
  35 |         })
  36 |       });
  37 |     });
  38 | 
  39 |     await page.route('/api/metrics/history', async route => {
  40 |       await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  41 |     });
  42 | 
  43 |     // Provide a mocked delayed response for /api/portal so we can observe the loading state
  44 |     await page.route('/api/portal', async route => {
  45 |       await new Promise(resolve => setTimeout(resolve, 3000));
  46 |       await route.fulfill({
  47 |         status: 200,
  48 |         contentType: 'application/json',
  49 |         body: JSON.stringify({ url: 'javascript:void(0)' })
  50 |       });
  51 |     });
  52 | 
  53 |     await page.goto('/dashboard');
  54 |     
  55 |     const manageSubscriptionBtn = page.getByRole('button', { name: /manage subscription|redirecting/i });
  56 |     
> 57 |     await expect(manageSubscriptionBtn).toBeVisible();
     |                                         ^ Error: expect(locator).toBeVisible() failed
  58 |     await expect(manageSubscriptionBtn).toBeEnabled();
  59 |     await expect(manageSubscriptionBtn).toHaveClass(/cursor-pointer/);
  60 |     
  61 |     // Click and expect the transition to the loading state
  62 |     await manageSubscriptionBtn.click();
  63 |     await expect(manageSubscriptionBtn).toBeDisabled();
  64 |     await expect(manageSubscriptionBtn).toHaveText(/Redirecting/);
  65 |     await expect(manageSubscriptionBtn).toHaveClass(/cursor-wait/);
  66 |   });
  67 | });
  68 | 
```