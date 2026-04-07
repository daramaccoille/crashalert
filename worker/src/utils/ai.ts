import { Env } from '../index';
import { MarketData } from '../market';

export async function generateMarketSentiment(data: MarketData, env: Env): Promise<{ sentiment: string, newsStats: any }> {
    const apiKey = env.GEMINI_KEY?.trim();
    if (!apiKey) {
        console.warn("GEMINI_KEY missing, skipping sentiment generation.");
        return { sentiment: "Market sentiment analysis currently unavailable.", newsStats: null };
    }

    let newsSummary = "No recent major news.";
    const newsStats = {
        counts: { "Bearish": 0, "Somewhat-Bearish": 0, "Neutral": 0, "Somewhat-Bullish": 0, "Bullish": 0 },
        overallLabel: "Neutral"
    };

    if (env.AV_KEY) {
        try {
            const newsRes = await fetch(`https://www.alphavantage.co/query?function=NEWS_SENTIMENT&limit=50&apikey=${env.AV_KEY}`);
            if (newsRes.ok) {
                const newsData: any = await newsRes.json();
                if (newsData.feed && Array.isArray(newsData.feed)) {
                    const articles = newsData.feed;
                    let recentSummary = [];
                    for (let i = 0; i < articles.length; i++) {
                        let article = articles[i];
                        
                        if (article.ticker_sentiment && Array.isArray(article.ticker_sentiment)) {
                            article.ticker_sentiment.forEach((ts: any) => {
                                let label = ts.ticker_sentiment_label;
                                // Handle potential underscores from older API outputs
                                if (label === "Somewhat_Bullish") label = "Somewhat-Bullish";
                                else if (label === "Somewhat_Bearish") label = "Somewhat-Bearish";
                                
                                if ((newsStats.counts as any)[label] !== undefined) {
                                    (newsStats.counts as any)[label]++;
                                }
                            });
                        }

                        if (i < 7) recentSummary.push(`- ${article.title} (${article.overall_sentiment_label || ''})`);
                    }
                    newsSummary = recentSummary.join("\n");

                    let maxFreq = 0;
                    Object.keys(newsStats.counts).forEach(key => {
                        if ((newsStats.counts as any)[key] > maxFreq) {
                            maxFreq = (newsStats.counts as any)[key];
                            newsStats.overallLabel = key;
                        }
                    });
                }
            }
        } catch (e) {
            console.error("Failed to fetch news", e);
        }
    }

    const prompt = `
    Analyze the following market metrics and recent financial news.
    You must output a JSON object with exactly one key:
    1. "sentiment": A professional 1-2 sentence market sentiment summary (max 30 words). Focus on risk level and describe current macroeconomic or geopolitical narratives if present.
    
    Metrics:
    - VIX: ${data.vix} (Score: ${data.vixScore})
    - Yield Spread: ${data.yieldSpread}
    - Liquidity: ${data.liquidity}T
    - Market Mode: ${data.marketMode}
    - One Month Ahead Forecast: ${data.oneMonthAhead}

    Recent Top Financial News:
    ${newsSummary}
    News Sentiment Overview Mode: ${newsStats.overallLabel}
    `;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: "You are a financial analyst. Always output pure, valid JSON with a single key 'sentiment'. Do not wrap in markdown code blocks." }] },
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { response_mime_type: "application/json" }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const json: any = await response.json();
        const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("No text returned from Gemini");
        
        const parsed = JSON.parse(rawText);
        return { 
            sentiment: parsed.sentiment || "Market conditions are stable.", 
            newsStats 
        };

    } catch (error) {
        console.error("Error generating sentiment:", error);
        return { sentiment: "Market data processing complete.", newsStats };
    }
}
