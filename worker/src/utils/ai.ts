import { Env } from '../index';
import { MarketData } from '../market';

export async function generateMarketSentiment(data: MarketData, env: Env): Promise<string> {
    const apiKey = env.GEMINI_KEY;
    if (!apiKey) {
        console.warn("GEMINI_KEY missing, skipping sentiment generation.");
        return "Market sentiment analysis currently unavailable.";
    }

    const prompt = `
    Analyze the following market metrics and generate a concise, professional 1-sentence market sentiment summary (max 20 words).
    Focus on risk level and trend.
    
    Metrics:
    - VIX: ${data.vix} (Score: ${data.vixScore})
    - Yield Spread: ${data.yieldSpread}
    - Liquidity: ${data.liquidity}T
    - Market Mode: ${data.marketMode}
    - One Month Ahead Forecast: ${data.oneMonthAhead}

    Example Output: "Volatility remains low with bullish liquidity support, suggesting continued stability in the near term."
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.statusText}`);
        }

        const json: any = await response.json();
        const sentiment = json.candidates?.[0]?.content?.parts?.[0]?.text || "Market conditions are stable.";
        return sentiment.trim();

    } catch (error) {
        console.error("Error generating sentiment:", error);
        return "Market data processing complete.";
    }
}
