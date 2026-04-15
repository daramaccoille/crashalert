# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: metrics.spec.ts >> Metrics & Components Functionality >> Toggles Metric Cards to Detailed Analysis display
- Location: tests\e2e\metrics.spec.ts:93:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h3').filter({ hasText: 'VIX (Volatility)' })
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('h3').filter({ hasText: 'VIX (Volatility)' })

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
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Metrics & Components Functionality', () => {
  4   |   test.beforeEach(async ({ context, page }) => {
  5   |     await context.setExtraHTTPHeaders({
  6   |        'x-playwright-test': 'true'
  7   |     });
  8   | 
  9   |     await page.route('/api/metrics', async route => {
  10  |       await route.fulfill({
  11  |         status: 200,
  12  |         contentType: 'application/json',
  13  |         body: JSON.stringify({
  14  |           vix: 25, // Above threshold of 20 (Danger)
  15  |           yieldSpread: -1.0, // Below threshold of 0 (Danger)
  16  |           sp500pe: 20, // Below threshold of 25 (Safe)
  17  |           liquidity: 6, // Above threshold of 5 (Safe)
  18  |           junkBondSpread: 400,
  19  |           marketMode: 'BEAR',
  20  |           oecdValue: '99',
  21  |           oecdMomentum: '-0.5',
  22  |           oecdTrend: 'deteriorating',
  23  |           sentiment: 'Bullish market sentiment observed.',
  24  |           rawJson: {
  25  |             newsStats: {
  26  |               overallLabel: 'Somewhat-Bullish',
  27  |               counts: {
  28  |                 'Bearish': 2,
  29  |                 'Somewhat-Bearish': 0,
  30  |                 'Neutral': 5,
  31  |                 'Somewhat-Bullish': 10,
  32  |                 'Bullish': 4
  33  |               }
  34  |             },
  35  |             calendar: {
  36  |               future: [
  37  |                 { title: 'Fed Interest Rate Decision', country: 'US', date: new Date(Date.now() + 86400000).toISOString() }
  38  |               ],
  39  |               past: []
  40  |             }
  41  |           },
  42  |           createdAt: new Date().toISOString()
  43  |         })
  44  |       });
  45  |     });
  46  | 
  47  |     await page.route('/api/metrics/history', async route => {
  48  |       await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  49  |     });
  50  |   });
  51  | 
  52  |   test('Renders AI Sentiment and Economic Calendar components', async ({ page }) => {
  53  |     await page.goto('/dashboard');
  54  | 
  55  |     // Wait until dashboard is loaded
  56  |     await expect(page.getByRole('heading', { name: /Market Overview/i })).toBeVisible();
  57  | 
  58  |     // Verify AI Sentiment is visible
  59  |     await expect(page.getByText('Bullish market sentiment observed.')).toBeVisible();
  60  |     await expect(page.getByText('AlphaVantage Global News Sentiment (Somewhat-Bullish)')).toBeVisible();
  61  | 
  62  |     // Verify Economic Calendar is visible
  63  |     await expect(page.getByRole('heading', { name: /Major Economic Calendar/i })).toBeVisible();
  64  |     await expect(page.getByText('Fed Interest Rate Decision')).toBeVisible();
  65  |   });
  66  | 
  67  |   test('Metric Cards display varying risk colors and trends', async ({ page }) => {
  68  |     await page.goto('/dashboard');
  69  |     
  70  |     // Check VIX text color is red (threshold > 20 is danger for VIX)
  71  |     // We mocked VIX to 25.00
  72  |     const vixCard = page.locator('div').filter({ hasText: 'VIX (Volatility)' }).nth(1);
  73  |     await expect(vixCard).toBeVisible();
  74  |     
  75  |     // Check for the rendered VIX value (25.00) and verify it has the tailwind red class
  76  |     const vixValue = page.getByText('25.00');
  77  |     // We expect at least one 25.00 to have the text-red-500 class.
  78  |     await expect(vixValue.first()).toHaveClass(/text-red-500/);
  79  | 
  80  |     // Yield Spread is mocked to -1.00. Threshold is < 0 -> danger (red)
  81  |     const yieldValue = page.getByText('-1.00');
  82  |     await expect(yieldValue.first()).toHaveClass(/text-red-500/);
  83  | 
  84  |     // S&P 500 P/E is mocked to 20.00. Threshold > 25 is danger. So 20 is safe (green)
  85  |     const peValue = page.getByText('20.00');
  86  |     await expect(peValue.first()).toHaveClass(/text-green-500/);
  87  |     
  88  |     // OECD Trend should say deteriorating in red
  89  |     const oecdTrend = page.locator('span').filter({ hasText: 'deteriorating' }).first();
  90  |     await expect(oecdTrend).toHaveClass(/text-red-500/);
  91  |   });
  92  | 
  93  |   test('Toggles Metric Cards to Detailed Analysis display', async ({ page }) => {
  94  |     await page.goto('/dashboard');
  95  | 
  96  |     // Currently selected by default: 'vix', 'yield'
  97  |     const vixChartHeader = page.locator('h3', { hasText: 'VIX (Volatility)' });
> 98  |     await expect(vixChartHeader).toBeVisible();
      |                                  ^ Error: expect(locator).toBeVisible() failed
  99  | 
  100 |     // Click on the card to toggle it off
  101 |     await page.locator('.cursor-pointer', { hasText: 'VIX (Volatility)' }).click();
  102 | 
  103 |     // Now 'VIX (Volatility)' chart should disappear from Detailed Analysis
  104 |     await expect(page.locator('h3', { hasText: 'VIX (Volatility)' })).toHaveCount(0);
  105 |     
  106 |     // Check that we now have 1/8 selected by finding the literal string somewhere in the heading
  107 |     await expect(page.locator('h2', { hasText: /Detailed Analysis.*\s*\(1\/8 Selected\)/ })).toBeVisible();
  108 | 
  109 |     // Toggle on 'S&P 500 P/E'
  110 |     await page.locator('.cursor-pointer', { hasText: 'S&P 500 P/E' }).click();
  111 | 
  112 |     // Verify it appears in the charts grid
  113 |     await expect(page.locator('h2', { hasText: /Detailed Analysis.*\s*\(2\/8 Selected\)/ })).toBeVisible();
  114 |     await expect(page.locator('h3', { hasText: 'S&P 500 P/E' })).toBeVisible();
  115 |   });
  116 | });
  117 | 
```