# CrashAlert

**Institutional-grade risk intelligence for individual investors.**

CrashAlert monitors critical financial indicators (VIX, Yield Curve, Liquidity, etc.) to predict market crashes and volatility. It features a Next.js frontend, Cloudflare Worker backend, and Neon PostgreSQL database.

## Project Structure

- **`/web`**: Next.js 15 App (App Router, Tailwind, Glassmorphism UI).
  - Landing Page (`/`)
  - Enterprise Dashboard (`/dashboard/alerts`)
  - Billing (Stripe Webhooks)
- **`/worker`**: Cloudflare Worker (Cron Triggers, Data Fetching).
  - Fetches data from FRED & AlphaVantage.
  - Generates Trend Charts via QuickChart.io.
  - Sends Emails via Resend.
- **`/drizzle`**: Database Schema (Shared Source of Truth).
  - Managed via Drizzle Kit (`npx drizzle-kit push`).

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL (Neon)
- Cloudflare Account
- Stripe & Resend Accounts

### Development

1. **Install Dependencies**
   ```bash
   npm install
   cd web && npm install
   cd ../worker && npm install
   ```

2. **Environment Variables**
   Create `.env` in root and `web/`:
   ```env
   DATABASE_URL="postgres://..."
   STRIPE_KEY="sk_test_..."
   RESEND_KEY="re_..."
   GEMINI_KEY="AI_..."
   ```

3. **Run Web App**
   ```bash
   cd web
   npm run dev
   ```

4. **Deploy Worker**
   ```bash
   cd worker
   npx wrangler deploy
   ```

## Architecture
- **Frontend**: Next.js on Cloudflare Pages.
- **Backend**: Cloudflare Workers (Scheduled Cron).
- **DB**: Neon Serverless Postgres.
- **AI**: Gemini 1.5 Flash (Market Predictions).
