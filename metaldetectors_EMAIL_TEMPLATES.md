
# Email Design System

## 1. Pro Tier Template
**Audience**: Paid Subscribers ($5/mo)
**Tone**: Premium, Insightful, "The Trusted Expert"
**Metals**: XAU, XAG, Cu, Pt, Pd

### Layout Structure
1.  **Header**
    *   Logo: "MetalDetectors Daily" (Gold/Metal text)
    *   Subtitle: "High-Conviction AI Signals"
    *   Date: "January 27, 2026"

2.  **Market Pulse (Top Section)**
    *   Brief macro-summary (e.g., "Dollar weakening pushes metals higher").
    *   Background: Dark charcoal gradient.

3.  **Signal Cards (Repeated for each metal)**
    *   **Container**: Glassmorphism effect (semi-transparent dark grey, thin white border).
    *   **Header**: Metal Name (e.g., "Gold (XAU)") + Badge (BUY/SELL/HOLD).
        *   BUY: Green Gradient Badge (`#10B981`)
        *   SELL: Red Gradient Badge (`#EF4444`)
        *   HOLD: Amber Badge (`#F59E0B`)
    *   **Data Grid**:
        *   Target Price: Large, Bold Text (Localized Currency)
        *   RSI: "RSI: 64 (Neutral)"
        *   Trend: "Trend: Bullish ↗"
    *   **AI Insight**: 
        *   *Icon*: Small brain/sparkle icon.
        *   *Text*: "AI detects a breakout pattern on the 4H chart..."

4.  **Footer**
    *   Links: Unsubscribe | Manage Account | Disclaimer
    *   Style: Muted grey text.

## 2. Basic Tier Template
**Audience**: Free Subscribers (or $1/mo Basic)
**Tone**: Concise, Functional, "The Snapshot"
**Metals**: XAG (Silver) Only

### Layout Structure
1.  **Header**
    *   Logo: Smaller, "MetalDetectors Basic"
    *   Date: Standard format.

2.  **Silver Snapshot Card**
    *   **Style**: Clean slate grey background, Blue accent border (`#3B82F6`).
    *   **Headline**: "Silver (XAG)"
    *   **Big Number**: Current Price (Localized).
    *   **Trend Indicator**: Simple Arrow (▲ +0.75%)
    *   **Summary**: 2-sentence market recap (No AI deep dive, just facts).

3.  **Upgrade Call-to-Action (Sticky Bottom)**
    *   **Text**: "Unlock Gold, Copper, Platinum & AI Predictions."
    *   **Button**: "Upgrade to Pro ($5/mo)" - Gold Gradient Button.

4.  **Footer**
    *   Standard Unsubscribe links.

## CSS / Style Tokens (Inline Recommendations)
*   **Background**: `#111827` (Rich Black)
*   **Glass Card**: `background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(10px);`
*   **Gold**: `#D4AF37`
*   **Silver**: `#C0C0C0`
*   **Font**: `Inter` or System Sans-Serif.
