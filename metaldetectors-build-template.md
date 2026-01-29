
# Implementation Guide: metaldetectors Landing & Backend

## 0. Project Overview
## 1. Project Architecture
- **Frontend**: Next.js (App Router) hosted on Cloudflare Pages.
- **Backend**: Cloudflare Workers (via Wrangler) for API and Cron Jobs.
- **Database**: Neon PostgreSQL (Serverless) using `drizzle-orm`.
- **Payments**: Stripe Checkout for monthly subscriptions.
- **Mail**: Resend API for daily newsletters.

## 2. Landing Page Requirements (High-Conversion)
- **Visuals**: Dark mode, "Glassmorphism" UI. 
- **Internationalization (i18n)**:
  - Detect locale via `headers['cf-ipcountry']`.
  - Display currency in locally rounded units (€1, £1, $1).
- **The Squeeze**:
  - Hero: "Daily AI Metals Signals. 2-Minute Read."
  - Form: Single Email field + CTA button.
  - Stripe Integration: Redirect to Stripe Checkout upon email submission.

## 3. Database Schema (`drizzle/schema.ts`)
```typescript
export const subscribers = pgTable('subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  currency: text('currency').default('USD'), // USD, EUR, GBP
  locale: text('locale').default('en-US'),
  stripeId: text('stripe_id'),
  active: boolean('active').default(false),
});
```
### System Instruction: You are a senior commodities quantitative analyst for "metaldetectors." Your task is to provide a daily trading digest for XAU, XAG, Cu, Pt, Pd.

Output Format (JSON strictly): Return a JSON object with keys for each metal. Each metal must include:

sentiment: (Number -1.0 to 1.0)

trend: ("up", "down", or "sideways")

rsi: (Current value)

bb_status: ("above_high", "below_low", or "within_range")

ai_guess: { "action": "buy"|"sell"|"hold", "timeframe": "string", "target": number (USD base) }

reasoning_en: A one-sentence explanation in English.

Constraint: All target prices must be provided in USD. The application layer will handle currency conversion and rounding.

## // utils/format.ts

```typescript
export type SupportedLocale = 'en-US' | 'de-DE' | 'fr-FR' | 'en-GB';
export type SupportedCurrency = 'USD' | 'EUR' | 'GBP';

export function formatMetalPrice(
  priceUSD: number, 
  fxRate: number, 
  currency: SupportedCurrency, 
  locale: SupportedLocale
) {
  const convertedPrice = priceUSD * fxRate;
  
  // We round to the nearest whole unit as requested (€1, £1, $1)
  const roundedPrice = Math.round(convertedPrice);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0, // Forces rounding to whole number
  }).format(roundedPrice);
}```

### Database Update 
Add locale and currency to your subscriber table so the Worker knows how to format the email.

```typescript
export const subscribers = pgTable('subscribers', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  currency: text('currency').default('USD'), // USD, EUR, GBP
  locale: text('locale').default('en-US'),
  stripeId: text('stripe_id'),
  active: boolean('active').default(false),
});
``` sql
ALTER TABLE subscribers 
ADD COLUMN preferred_locale TEXT DEFAULT 'en-US',
ADD COLUMN preferred_currency TEXT DEFAULT 'USD';
```

### Multilingual Email Workflow
Worker Trigger: Runs daily.

Fetch FX Rates: Call a free API (like exchangerate-api.com) to get current USD/EUR and USD/GBP.

Gemini Call: Get the raw JSON signal data (in USD).

Loop Subscribers:

Retrieve preferred_locale and preferred_currency.

Translate: Use a simple JSON dictionary for static strings (e.g., "Trend" -> "Tendence").

Convert: Use the formatMetalPrice utility to round the Gemini targets to the nearest €1/£1/$1.

Send: Dispatch the localized email via Resend.

## // utils/email.ts

```typescript
export function sendEmail(
  to: string,
  subject: string,
  html: string,
  locale: SupportedLocale,
  currency: SupportedCurrency
) {
  const from = 'metaldetectors@resend.dev';
  const content = {
    from,
    to,
    subject,
    html,
  };

  return resend.emails.send(content);
}```

## pricing.ts

```typescript
export const pricing = {
  monthly: {
    price: 5,
    currency: 'USD',
    interval: 'month',
    description: 'Monthly subscription',
  },
};```

## Pricing Table

Feature,Basic (Free),Pro (Paid)
Metals,XAU only,All 5 Metals
Gemini Pick,❌,✅ Included
Frequency,Weekly,Daily
Price,$0,**$5 / £4 / €5**

### Backend Workflow

Trigger: Cron Trigger 0 07:00 * * * (UTC).

Data Fetch: Pull XAU, XAG, Cu, Pt, Pd data (RSI, BB, Sentiment) from Financial APIs.

AI Generation: Pass data to Gemini (see backend-ai-role.md).

Localization: Use Intl.NumberFormat to convert Gemini's USD targets to Subscriber's currency.

Dispatch: Send formatted HTML email via Resend to all active: true users.

### File 2: `backend-ai-role.md`
**Target Audience:** Gemini 1.5 Flash / Backend Analysis Engine  
**Role:** Senior Commodities Quantitative Analyst.

```markdown
# System Instruction: metaldetectors Analyst Role

## 1. Persona
You are a Senior Commodities Quantitative Analyst with 15 years of experience in precious and base metals. Your communication style is "The Trusted Expert": concise, data-driven, and decisive. You don't hedge your bets; you provide clear, actionable guesses based on the data provided.

## 2. Input Context
You will receive a daily JSON packet containing technical indicators for five assets: Gold (XAU), Silver (XAG), Copper (Cu), Platinum (Pt), and Palladium (Pd). 
Indicators include:
- RSI (Relative Strength Index)
- Bollinger Bands (H4, D1, W1 positions)
- Sentiment (Social/News weighted score)
- Trend (Moving Average alignments)

## 3. Analysis Logic
- **Volatility Check**: If Bollinger Bands are tight (Squeeze), flag "Low Volatility/Breakout Pending."
- **Overbought/Oversold**: If RSI > 70 or < 30, prioritize mean-reversion signals.
- **Trend Alignment**: Ensure your "Buy/Sell" guess aligns with the D1/W1 trend unless technicals suggest a sharp reversal.

## 4. Output Specification (Strict JSON)
You must return a raw JSON object. Do not include prose outside the JSON.
- **`target_price`**: Must be a number (USD).
- **`ai_guess`**: Must start with a verb (e.g., "Buy early", "Short at pivot", "Hold until news").
- **`reasoning`**: Max 15 words explaining the technical trigger.

**Example Format:**
{
  "XAU": {
    "volatility": "High",
    "sentiment": "Positive",
    "trend": "Up",
    "ai_guess": "Buy early until pivot at 2050",
    "target_price": 2055,
    "reasoning": "RSI oversold on H4 with strong support at previous daily low."
  },
  ...
}

## 5. Tone & Voice
Avoid: "It might...", "Perhaps...", "Investors could...".
Use: "Target is...", "Trend confirms...", "Expect bounce at...".
```

## Phase 2: Live Data & Domain Integration (Next Steps)

### 1. Domain Configuration (`metaldetectors.info`)
- **Cloudflare**: Add site to Cloudflare Dashboard. Update nameservers at Ionos to point to Cloudflare.
- **Resend**: 
  - Add domain `metaldetectors.info` to Resend.
  - Add generated DNS records (DKIM, SPF, DMARC) to Cloudflare DNS settings.
  - Update `worker/src/utils/email.ts` to send *from* `signals@metaldetectors.info` instead of `onboarding@resend.dev`.

### 2. Stripe Webhook (Critical for Activation)
- **Problem**: Current implementation adds users as `active: false` or "Pending". We need to flip them to `active: true` only when payment succeeds.
- **Solution**:
  - Create `/api/webhooks/stripe` endpoint in Next.js (`web`).
  - Listen for `checkout.session.completed` event.
  - Update user status in Neon DB based on `client_reference_id` or email match.
  - Deploy to production to get a real webhook URL (or use Stripe CLI for local testing).

### 3. Real Market Data (Removing Mocks)
- **Task**: The worker currently uses `generateMockMarketData()`.
- **Action**: 
  - Identify a market data API (e.g., Alpha Vantage, Financial Modeling Prep, or specialized Metals API).
  - Implement a `fetchMarketData()` function in `worker/src/index.ts`.
  - Ensure data format matches the structure expected by the Gemini prompt.

### 4. Legal & Compliance
- **Stripe Requirement**: Add "Privacy Policy" and "Terms of Service" pages to the footer.
- **Unsubscribe**: Add a unique unsubscribe link to the bottom of every email sent by the worker. (Simple version: JWT token link to a Next.js API route that updates `active: false`).

### 5. Deployment Checklist
- [ ] Push `web` to Cloudflare Pages.
- [ ] Run `npm run drizzle-kit push` against production Neon DB.
- [ ] Deploy worker: `cd worker && npx wrangler deploy`.
- [ ] Set production secrets via `npx wrangler secret put`.

3. Check **Resend Logs** to see if an email was dispatched.
4. If you have a test user in the DB with ctive: true, check that inbox.

### 3. Email Template Refinement
Currently, the email HTML is generated inline in worker/src/index.ts.
**Future Improvement**:
- Create a dedicated file worker/src/templates/daily-digest.ts.
- Use a library like @react-email/components if you want easier styling, or simply extract the HTML string builder function to keep the main loop clean.

- Ensure the Unsubscribe link points to a real endpoint (currently a placeholder).

### 4. AI Prompt Engineering
Monitor the Gemini outputs in the email.
- If the analysis feels generic, tweak the SYSTEM_INSTRUCTION in worker/src/ai/gemini.ts.
- You can add more technical indicators (e.g., MACD, Moving Averages) to the etchMarketData payload to give the AI more context.

3. Check **Resend Logs** to see if an email was dispatched.
4. If you have a test user in the DB with ctive: true, check that inbox.

### 3. Email Template Refinement
Currently, the email HTML is generated inline in worker/src/index.ts.
**Future Improvement**:
- Create a dedicated file worker/src/templates/daily-digest.ts.
- Use a library like @react-email/components if you want easier styling, or simply extract the HTML string builder function to keep the main loop clean.



- Ensure the Unsubscribe link points to a real endpoint (currently a placeholder).


### 2. Verify AI & Email Loop
The worker is deployed and scheduled for 07:00 UTC, but we should verify it manually.
1. Ensure your FMP and Gemini keys are set in the Worker (via wrangler secret put).
2. Trigger the scheduled event manually via curl (since we added the fetch handler):
   `ash
   curl https://worker.daramaccoille.workers.dev/
   `"

