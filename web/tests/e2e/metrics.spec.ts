import { test, expect } from '@playwright/test';

test.describe('Metrics & Components Functionality', () => {
  test.beforeEach(async ({ context, page }) => {
    await context.setExtraHTTPHeaders({
       'x-playwright-test': 'true'
    });

    await page.route('/api/metrics', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          vix: 25, // Above threshold of 20 (Danger)
          yieldSpread: -1.0, // Below threshold of 0 (Danger)
          sp500pe: 20, // Below threshold of 25 (Safe)
          liquidity: 6, // Above threshold of 5 (Safe)
          junkBondSpread: 400,
          marketMode: 'BEAR',
          oecdValue: '99',
          oecdMomentum: '-0.5',
          oecdTrend: 'deteriorating',
          sentiment: 'Bullish market sentiment observed.',
          rawJson: {
            newsStats: {
              overallLabel: 'Somewhat-Bullish',
              counts: {
                'Bearish': 2,
                'Somewhat-Bearish': 0,
                'Neutral': 5,
                'Somewhat-Bullish': 10,
                'Bullish': 4
              }
            },
            calendar: {
              future: [
                { title: 'Fed Interest Rate Decision', country: 'US', date: new Date(Date.now() + 86400000).toISOString() }
              ],
              past: []
            }
          },
          createdAt: new Date().toISOString()
        })
      });
    });

    await page.route('/api/metrics/history', async route => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    });
  });

  test('Renders AI Sentiment and Economic Calendar components', async ({ page }) => {
    await page.goto('/dashboard');

    // Wait until dashboard is loaded
    await expect(page.getByRole('heading', { name: /Market Overview/i })).toBeVisible();

    // Verify AI Sentiment is visible
    await expect(page.getByText('Bullish market sentiment observed.')).toBeVisible();
    await expect(page.getByText('AlphaVantage Global News Sentiment (Somewhat-Bullish)')).toBeVisible();

    // Verify Economic Calendar is visible
    await expect(page.getByRole('heading', { name: /Major Economic Calendar/i })).toBeVisible();
    await expect(page.getByText('Fed Interest Rate Decision')).toBeVisible();
  });

  test('Metric Cards display varying risk colors and trends', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check VIX text color is red (threshold > 20 is danger for VIX)
    // We mocked VIX to 25.00
    const vixCard = page.locator('div').filter({ hasText: 'VIX (Volatility)' }).nth(1);
    await expect(vixCard).toBeVisible();
    
    // Check for the rendered VIX value (25.00) and verify it has the tailwind red class
    const vixValue = page.getByText('25.00');
    // We expect at least one 25.00 to have the text-red-500 class.
    await expect(vixValue.first()).toHaveClass(/text-red-500/);

    // Yield Spread is mocked to -1.00. Threshold is < 0 -> danger (red)
    const yieldValue = page.getByText('-1.00');
    await expect(yieldValue.first()).toHaveClass(/text-red-500/);

    // S&P 500 P/E is mocked to 20.00. Threshold > 25 is danger. So 20 is safe (green)
    const peValue = page.getByText('20.00');
    await expect(peValue.first()).toHaveClass(/text-green-500/);
    
    // OECD Trend should say deteriorating in red
    const oecdTrend = page.locator('span').filter({ hasText: 'deteriorating' }).first();
    await expect(oecdTrend).toHaveClass(/text-red-500/);
  });

  test('Toggles Metric Cards to Detailed Analysis display', async ({ page }) => {
    await page.goto('/dashboard');

    // Currently selected by default: 'vix', 'yield'
    const vixChartHeader = page.locator('h3', { hasText: 'VIX (Volatility)' });
    await expect(vixChartHeader).toBeVisible();

    // Click on the card to toggle it off
    await page.locator('.cursor-pointer', { hasText: 'VIX (Volatility)' }).click();

    // Now 'VIX (Volatility)' chart should disappear from Detailed Analysis
    await expect(page.locator('h3', { hasText: 'VIX (Volatility)' })).toHaveCount(0);
    
    // Check that we now have 1/8 selected by finding the literal string somewhere in the heading
    await expect(page.locator('h2', { hasText: /Detailed Analysis.*\s*\(1\/8 Selected\)/ })).toBeVisible();

    // Toggle on 'S&P 500 P/E'
    await page.locator('.cursor-pointer', { hasText: 'S&P 500 P/E' }).click();

    // Verify it appears in the charts grid
    await expect(page.locator('h2', { hasText: /Detailed Analysis.*\s*\(2\/8 Selected\)/ })).toBeVisible();
    await expect(page.locator('h3', { hasText: 'S&P 500 P/E' })).toBeVisible();
  });
});
