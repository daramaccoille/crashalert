import { Env } from '../index';
import { MarketData } from '../market';

export async function generateMarketSentiment(data: MarketData, env: Env): Promise<{ sentiment: string, events: any[] }> {
    const apiKey = env.GEMINI_KEY?.trim();
    if (!apiKey) {
        console.warn("GEMINI_KEY missing, skipping sentiment generation.");
        return { sentiment: "Market sentiment analysis currently unavailable.", events: [] };
    }

    let newsSummary = "No recent major news.";
    if (env.AV_KEY) {
        try {
            const newsRes = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&limit=10&apikey=${env.AV_KEY}`);
            if (newsRes.ok) {
                const newsData: any = await newsRes.json();
                if (newsData.feed && Array.isArray(newsData.feed)) {
                    newsSummary = newsData.feed
                        .slice(0, 10)
                        .map((f: any) => `- ${f.title}`)
                        .join('\n');
                }
            }
        } catch (e) {
            console.error("Failed to fetch news", e);
        }
    }

    const prompt = `
    Analyze the following market metrics and recent financial news.
    You must output a JSON object with exactly two keys:
    1. "sentiment": A professional 1-2 sentence market sentiment summary (max 30 words). Focus on risk level and describe current macroeconomic or geopolitical narratives (e.g. wars, tech bubbles) if present.
    2. "events": Extract exactly the 3 main past, present, or future qualitative news events currently affecting the market from the news. Each event must be an object: {"title": "concise description max 10 words", "timeframe": "past" | "future" | "current"}.
    
    Metrics:
    - VIX: ${data.vix} (Score: ${data.vixScore})
    - Yield Spread: ${data.yieldSpread}
    - Liquidity: ${data.liquidity}T
    - Market Mode: ${data.marketMode}
    - One Month Ahead Forecast: ${data.oneMonthAhead}

    Recent Top Financial News:
    ${newsSummary}
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: "You are a financial analyst. Always output pure, valid JSON with keys 'sentiment' and 'events'. Do not wrap in markdown code blocks." }] },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText} - ${errorBody}`);
        }

        const json: any = await response.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("No text returned from Gemini");
        
        const parsed = JSON.parse(rawText);
        return { 
            sentiment: parsed.sentiment || "Market conditions are stable.", 
            events: parsed.events || [] 
        };

    } catch (error) {
        console.error("Error generating sentiment:", error);
        return { sentiment: "Market data processing complete.", events: [] };
    }
}
