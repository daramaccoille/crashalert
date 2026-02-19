# CrashAlert Improvement Plan & Status

## 1. Missed Functionality & Stripe Integration
**Objective:** Ensure seamless subscription management (Upgrade, Downgrade, Cancel) and robust syncing with the database.

*   **[IMPLEMENTED] Email Upgrade Links:**
    *   Added "Manage Subscription" links to `Pro` and `Expert` email templates.
    *   Links direct users to the dashboard where the portal button is located.
*   **[IMPLEMENTED] Stripe Webhook Robustness (`customer.subscription.updated`):**
    *   Now identifies plans via `price.id` (checking `STRIPE_PRICE_BASIC`, etc.) with fallback to metadata.
    *   Refactored to avoid stale metadata issues during portal upgrades.
*   **[Verified] Cancellation Handling:**
    *   `customer.subscription.deleted` sets `active = false`.

## 2. Daily Email Improvements
**Objective:** Enhance the value and readability of the daily reports.

*   **[IMPLEMENTED] Layout & Aesthetics:**
    *   Refined the email CSS for a cleaner, gold/premium look.
    *   Implemented a consistent header style with `metricInfo` descriptions.
*   **[IMPLEMENTED] Indicator Explanations:**
    *   Added concise (1-sentence) explanations for each metric (e.g., "VIX: Expected volatility. >20 signals fear.").
*   **[IMPLEMENTED] Content Structure:**
    *   **Basic:** Teaser focus + Upgrade CTA.
    *   **Pro:** Full metrics list + AI nuances + Manage Link.
    *   **Expert:** Deep dive + Charts + AI Strategy + Manage Link.

## 3. Codebase & Performance Improvements
**Objective:** Optimize the Worker and Web App for reliability and scale.

*   **[IMPLEMENTED] Worker Optimization (`worker/src/index.ts`):**
    *   **Batch Email Sending:** Implemented `Promise.all` with chunking (size 20) to prevent timeouts.
    *   **Hardcoded Values:** Removed test email; now uses `ADMIN_EMAIL` env var if present.
*   **[CRITICAL FIX] Security Vulnerability:**
    *   **Issue:** The authentication cookie `crashalert-user` was storing the user's email in plain text without a signature. This allowed potential impersonation by modifying the cookie.
    *   **Fix:** Implemented HMAC-SHA256 signing for the session cookie.
    *   **Files Updated:** `lib/session.ts` (created), `api/auth/login`, `api/portal`.

## 4. Next Steps / To Do
*   **Environment Variables:**
    *   **Worker:** Check `ADMIN_EMAIL`.
    *   **Web App:** Verified `CRASH_ALERT_PRICE_ID_BASIC`, `_PRO`, `_ADVANCED` are set. Ensures `AUTH_SECRET` is set (or relies on fallback).
*   **Testing:** Verify the full flow (Login -> Dashboard -> Portal -> Upgrade -> Email).
