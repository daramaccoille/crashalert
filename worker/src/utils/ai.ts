import { Env } from '../index';
import { MarketData } from '../market';

export async function generateMarketSentiment(data: MarketData, env: Env): Promise<string> {
    const apiKey = env.GEMINI_KEY?.trim();
    if (!apiKey) {
        console.warn("GEMINI_KEY missing, skipping sentiment generation.");
        return "Market sentiment analysis currently unavailable.";
    }

    let newsSummary = "No recent major news.";
    if (env.AV_KEY) {
        try {
            const newsRes = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&limit=5&apikey=${env.AV_KEY}`);
            if (newsRes.ok) {
                const newsData: any = await newsRes.json();
                if (newsData.feed && Array.isArray(newsData.feed)) {
                    newsSummary = newsData.feed
                        .slice(0, 5)
                        .map((f: any) => `- ${f.title}`)
                        .join('\n');
                }
            }
        } catch (e) {
            console.error("Failed to fetch news", e);
        }
    }

    const prompt = `
    Analyze the following market metrics and recent financial news, then generate a concise, professional 1-2 sentence market sentiment summary (max 30 words).
    Focus on quantitative risk level and identify current macroeconomic or geopolitical narratives (e.g. wars, tech bubbles) if present.
    
    Metrics:
    - VIX: ${data.vix} (Score: ${data.vixScore})
    - Yield Spread: ${data.yieldSpread}
    - Liquidity: ${data.liquidity}T
    - Market Mode: ${data.marketMode}
    - One Month Ahead Forecast: ${data.oneMonthAhead}

    Recent Top Financial News:
    ${newsSummary}

    Example Output: "Volatility remains low with bullish liquidity support, though geopolitical tensions in the Middle East suggest cautious optimism in the near term."
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const json: any = await response.json();
        const sentiment = json.candidates?.[0]?.content?.parts?.[0]?.text || "Market conditions are stable.";
        return sentiment.trim();

    } catch (error) {
        console.error("Error generating sentiment:", error);
        return "Market data processing complete.";
    }
}
