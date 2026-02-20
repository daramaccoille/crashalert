# CrashAlert Improvement Plan: Daily Email Product

## 1. Value Tier Refinement (The Emails)
**Objective:** Create clear differentiation between subscription levels to drive upgrades.

### A. Basic Tier ("The Hook")
*   **Focus:** Core sentiment and urgency.
*   **Content:** 
    *   Large "Market Mode" indicator (Bull/Bear).
    *   High-level metrics only (VIX, Yield Spread, Liquidity).
    *   **Teaser Logic:** Truncate AI Insights with a "Read full analysis" button.
    *   **CTA:** Prominent "Upgrade to Pro" section with feature comparison.

### B. Pro Tier ("The Dashboard")
*   **Focus:** Comprehensive data and professional aesthetics.
*   **Content:**
    *   Full list of 9 key risk indicators.
    *   **Visual Enhancements:** Implement a heatmapped metric table.
        *   `Green` (Safe), `Amber` (Caution), `Red` (Critical Risk).
    *   **Full AI Analyst:** Complete Gemini-generated strategic summary.
    *   **Brief Explanations:** Include the "Norms" 1-liners for all metrics.

### C. Expert Tier ("The Intelligence Suite")
*   **Focus:** Visual trends and predictive timing.
*   **Content:**
    *   **Expert Risk Graph:** A 30-day trendline showing the "Aggregate Risk Score" (sum of all individual scores).
        *   *Visual Milestone:* Highlight when the aggregate hits 5+ (Critical Warning Zone).
    *   **Strategic Forecast:** Enhanced projection chart.
    *   **Event Tracker:** "Next Signal Changes" section.
        *   *Example:* "S&P 500 P/E next update: 2 days," "CFNAI release: Monday."

## 2. Technical Enhancements
*   **Aggregate Risk Calculation:** Add logic in the worker to calculate a normalized 0-10 Risk Score for the Expert graph.
*   **Event Data Logic:** Implement a utility to track and predict FRED/S&P data release cycles to populate the "Event Tracker."
*   **Email Design System:** Move shared CSS and "Heatmap" logic into a dedicated style utility for consistency.

## 3. Visual Verification
*   **Web Portal Sync:** Ensure the Stripe Portal mockups match these new tiers (features correctly listed under Basic/Pro/Expert).
*   **Local Preview Tool:** Create a `/preview` route in the worker to view each email tier in the browser instantly.

---
**Next Step:** Implement the "Aggregate Risk" logic and update the Expert Email template with a trend chart.
