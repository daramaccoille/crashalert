import { fetchMarketData } from './market';
import { generateTrendChartUrl } from './utils/charts';
import { generateMarketSentiment } from './utils/ai';
import { sendEmail } from './utils/email';
import { getDb } from './db';
import { subscribers, marketMetrics } from './schema';
import { getBasicEmailHtml, getProEmailHtml, getExpertEmailHtml } from './templates/email-templates';
import { eq } from 'drizzle-orm';

export interface Env {
    DATABASE_URL: string;
    STRIPE_KEY: string;
    BREVO_API_KEY: string;
    GEMINI_KEY: string;
    FRED_KEY: string;
    AV_KEY: string;
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // Simple manual trigger endpoint for testing without waiting for Cron
        const url = new URL(request.url);
        if (url.pathname === '/trigger-update') {
            try {
                const data = await fetchMarketData(env);

                // Save to DB
                const db = getDb(env.DATABASE_URL);
                await db.insert(marketMetrics).values({
                    vix: data.vix.toFixed(2),
                    yieldSpread: data.yieldSpread.toFixed(2),
                    sp500pe: data.sp500pe.toFixed(2),
                    liquidity: data.liquidity.toFixed(2),
                    junkBondSpread: Math.round(data.junkBondSpread),
                    marginDebt: data.marginDebt.toFixed(2),
                    insiderActivity: data.insiderActivity.toFixed(2),
                    cfnai: data.cfnai.toFixed(2),

                    oneMonthAhead: data.oneMonthAhead.toFixed(2),
                    marketMode: data.marketMode,
                    sentiment: "Manual Trigger - Sentiment Skipped",
                    // Scores
                    vixScore: data.vixScore,
                    yieldSpreadScore: data.yieldSpreadScore,
                    sp500peScore: data.sp500peScore,
                    junkBondSpreadScore: data.junkBondSpreadScore,
                    marginDebtScore: data.marginDebtScore,
                    insiderActivityScore: data.insiderActivityScore,
                    cfnaiScore: data.cfnaiScore,
                    liquidityScore: data.liquidityScore,
                    oneMonthAheadScore: data.oneMonthAheadScore,

                    rawJson: data
                });

                // Test Email Send - Send a sample Pro email to admin
                const sampleHtml = getProEmailHtml(data);
                const emailResult = await sendEmail(
                    "dara@crashalert.online",
                    "CrashAlert Update Test",
                    sampleHtml,
                    env
                );

                return new Response(JSON.stringify({
                    success: true,
                    data,
                    emailResult
                }, null, 2), { headers: { 'content-type': 'application/json' } });
            } catch (e: any) {
                return new Response(`Error: ${e.message}`, { status: 500 });
            }
        }

        return new Response("CrashAlert Worker is running. Endpoints: /trigger-update");
    },

    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        console.log("Cron triggered at", new Date().toISOString());

        // Validation
        if (!env.BREVO_API_KEY) console.error("CRITICAL: BREVO_API_KEY is missing/undefined");
        if (!env.DATABASE_URL) console.error("CRITICAL: DATABASE_URL is missing/undefined");

        try {
            const data = await fetchMarketData(env);
            console.log("Market Data Fetched:", JSON.stringify(data));

            // 0. AI Sentiment
            const sentiment = await generateMarketSentiment(data, env);
            data.sentiment = sentiment;

            // 1. Save to DB
            const db = getDb(env.DATABASE_URL);
            await db.insert(marketMetrics).values({
                vix: data.vix.toFixed(2),
                yieldSpread: data.yieldSpread.toFixed(2),
                sp500pe: data.sp500pe.toFixed(2),
                liquidity: data.liquidity.toFixed(2),
                junkBondSpread: Math.round(data.junkBondSpread),
                marginDebt: data.marginDebt.toFixed(2),
                insiderActivity: data.insiderActivity.toFixed(2),
                cfnai: data.cfnai.toFixed(2),

                oneMonthAhead: data.oneMonthAhead.toFixed(2),
                marketMode: data.marketMode,
                sentiment: sentiment,

                // Scores
                vixScore: data.vixScore,
                yieldSpreadScore: data.yieldSpreadScore,
                sp500peScore: data.sp500peScore,
                junkBondSpreadScore: data.junkBondSpreadScore,
                marginDebtScore: data.marginDebtScore,
                insiderActivityScore: data.insiderActivityScore,
                cfnaiScore: data.cfnaiScore,
                liquidityScore: data.liquidityScore,
                oneMonthAheadScore: data.oneMonthAheadScore,

                rawJson: data
            });

            // 2. Determine Emails to send
            const activeSubscribers = await db.select().from(subscribers).where(eq(subscribers.active, true));
            console.log(`Found ${activeSubscribers.length} active subscribers.`);

            // Pre-generate chart for Expert/Advanced users (reused to save API calls if same content)
            let globalChartUrl = "";
            if (data.spyHistory && data.spyHistory.length > 0) {
                const chartData = data.spyHistory.slice(0, 30).reverse(); // specific slice
                if (chartData.length > 0) {
                    // Prediction mock: current price +/- 5% based on VIX
                    const lastVal = chartData[chartData.length - 1];
                    const prediction = lastVal * (1 + (data.oneMonthAhead / 100));

                    globalChartUrl = generateTrendChartUrl(
                        'S&P 500 Trend',
                        chartData,
                        prediction,
                        lastVal * 1.05, // Upper Bound
                        lastVal * 0.95  // Lower Bound
                    );
                }
            } else {
                console.warn("No SPY history available, skipping chart.");
            }

            for (const sub of activeSubscribers) {
                let html = '';
                try {
                    switch (sub.plan) {
                        case 'expert':
                        case 'advanced':
                            html = getExpertEmailHtml(data, globalChartUrl);
                            break;
                        case 'pro':
                            html = getProEmailHtml(data);
                            break;
                        case 'basic':
                        default:
                            html = getBasicEmailHtml(data);
                            break;
                    }

                    await sendEmail(sub.email, "Daily Market Risk Report", html, env);
                } catch (err) {
                    console.error(`Failed to email ${sub.email}:`, err);
                }
            }

        } catch (e) {
            console.error("Cron failed:", e);
        }
    },
};
