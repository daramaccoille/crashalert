# Implementation Guide: CrashAlert - Market Risk Intelligence

## 0. Project Overview
CrashAlert is a premium market risk intelligence platform. It monitors critical financial indicators (VIX, Yield Curve, Liquidity, etc.) to predict market crashes and volatility. The system offers tiered subscriptions, with the Enterprise tier featuring deep customization and AI-driven trend predictions.

## 1. Project Architecture
- **Frontend**: Next.js (App Router) hosted on Cloudflare Pages.
    - *Aesthetics*: Premium, Dark Mode, Glassmorphism, "Alive" with micro-animations.
- **Backend**: Cloudflare Workers (via Wrangler) for API, Cron Jobs, and Data Fetching.
- **Database**: Neon PostgreSQL (Serverless) using `drizzle-orm`.
- **Payments**: Stripe Checkout for Basic, Pro, and Enterprise subscriptions.
- **Mail**: Resend API for transactional and daily alert emails.
- **AI**: Google Gemini 1.5 Flash for market condition summaries and trend predictions.
- **Chart Generation**: QuickChart.io or server-side SVG generation for email trend charts.

## 2. Landing Page Requirements (High-Conversion)
- **Visuals**: Deep black/navy chart backgrounds, "Warning Red" accents for risks, "Safety Green" for stability. Use glassmorphism for cards.
- **Structure**:
    - **Hero**: "Protect Your Portfolio. Predict The Crash."
    - **Live Ticker**: Scrolling marquee of current risk levels (e.g., "VIX: 16.5 (Safe)", "Yield Curve: -0.71 (Inverted)").
    - **The Hook**: "Get notified *before* the market drops."
    - **Input**: Single email field → Redirects to Stripe Pricing/Checkout.
    - **Social Proof**: "Monitoring $XM in assets" (Simulated or real counter).

## 3. Database Schema (`drizzle/schema.ts`)
```typescript
import { pgTable, uuid, text, boolean, jsonb, timestamp, integer } from 'drizzle-orm/pg-core';

export const subscribers = pgTable('subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  plan: text('plan').default('basic'), // 'basic', 'pro', 'enterprise'
  stripeId: text('stripe_id'),
  active: boolean('active').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  // Enterprise only: Array of selected alert IDs (max 8)
  selectedAlerts: jsonb('selected_alerts').$type<string[]>(), 
});

export const marketMetrics = pgTable('market_metrics', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow(),
  vix: integer('vix'), // Stored as integer (e.g. 1645 for 16.45) or decimal
  yieldSpread: text('yield_spread'), // 10y-2y
  sp500pe: text('sp500_pe'),
  junkBondSpread: text('junk_bond_spread'),
  marginDebt: text('margin_debt'),
  insiderActivity: text('insider_activity'), // Buy/Sell Ratio
  cfnai: text('cfnai'), // Chicago Fed National Activity Index
  liquidity: text('central_bank_liquidity'), // Fed Assets
  marketMode: text('market_mode'), // BULL, BEAR, NEUTRAL
});
```

## 4. Subscription Tiers & Features

| Feature | Basic Plan | Pro Plan | Enterprise Plan |
| :--- | :--- | :--- | :--- |
| **Price** | Low (e.g. $9/mo) | Mid (e.g. $29/mo) | High (e.g. $99/mo) |
| **Email Type** | "Check Your Positions" | Detailed Risk Metrics | Custom + Prediction |
| **Content** | Simple Red/Green Signal | Full Dashboard of 8+ Indicators | User-Selected Indicators (Max 8) |
| **AI** | None | Market Summary | Deep Dive + Trend Prediction |
| **Charts** | None | Sparklines | **Trend Chart (Past + Future)** |

## 5. "Extras" - Enterprise Customization Page
A dedicated dashboard page (`/account/alerts`) for Enterprise users.
- **Interface**: A grid of available alerts (VIX, Yield Curve, Insider Ratio, Buffer Indicator, etc.).
- **Interaction**: Toggle switches to select alerts.
    - *Constraint*: Maximum 8 selected.
    - *Feedback*: "2/8 Selected". Disables remaining toggles when 8 are hit.
- **Explanation**: Hovering over an alert shows a tooltip explaining what it monitors (e.g., "Junk Bond Spread: Measures credit stress in the market.").

## 6. Email & Charting Architecture
The Enterprise email must contain a **Trend Chart**.
- **Data**: Past 30 days of data + Tomorrow's Gemini Prediction.
- **Visualization**: A trend line with "Normal Boundaries" (Standard Deviation bands).
- **Implementation**:
    1. Worker fetches historical metric data from Neon DB.
    2. Worker sends data to Gemini: "Given the last 30 days of VIX, predict tomorrow's range."
    3. Worker constructs a URL for QuickChart.io (or similar) to generate a static PNG/SVG.
        - *Example*: `https://quickchart.io/chart?c={type:'line',data:{...}}`
    4. Resend embeds this image URL in the `<img>` tag of the email HTML.

## 7. Backend Workflow (Worker)

### A. Data Collection (Cron: Daily Close)
1. **Fetch**:
    - **VIX, Yields, CFNAI, Liquidity**: FRED API.
    - **S&P 500 & PE**: Alpha Vantage / FMP API.
    - **Insider/Margin**: Scraping or Manual Entry (consider building a scraper for GuruFocus if distinct URL exists, else manual fallback).
2. **Calculate**:
    - Compute `Market Mode` (SPY > SMA200?).
    - Determine Risk Levels (Green/Amber/Red) via thresholds (e.g., VIX > 20 is Amber, > 30 is Red).
3. **Store**: Save snapshot to `marketMetrics` table.

### B. Daily Digest Dispatch
1. **Iterate Subscribers**:
2. **Prepare Content**:
    - *Basic*: "Market Risk is [HIGH/LOW]. Red Flags: [2/10]."
    - *Pro*: Full table of all metrics with current values and risk flags. AI Summary text.
    - *Enterprise*:
        - Fetch `selectedAlerts` for the user.
        - Generate custom trend chart for their *primary* selected metric (or composite risk score).
        - AI Prediction text: "VIX predicted to spike to 22 supported by rising yield spread."
3. **Send**: Via Resend.

## 8. Implementation Steps
1. **Setup**: Initialize Next.js project and Cloudflare Worker.
2. **DB**: define schema in Drizzle and push to Neon.
3. **Data**: Port GSheets `AlphaVantageClient` and `getFredYield` to TypeScript worker functions.
4. **Auth/Billing**: Implement Stripe Checkout and Webhook to handle `plan` assignment in DB.
5. **Frontend**: Build the Glassmorphism Landing Page + Enterprise Alert Picker.
6. **Email**: Design the 3 templates in React Email (`.jsx` components) and export to HTML for the worker.

## 9. Deployment Checklist
- [ ] Environment Variables (STRIPE_KEY, RESEND_KEY, GEMINI_KEY, DATABASE_URL) set in Cloudflare Dashboard.
- [ ] Stripe Webhook endpoint live and tested.
- [ ] Cron triggers verified.
- [ ] Domain `crashalert.info` configured in Cloudflare.
