import { fetchMarketData } from './market';
import { generateTrendChartUrl, generateExpertRiskChartUrl } from './utils/charts';
import { generateMarketSentiment } from './utils/ai';
import { sendEmail } from './utils/email';
import { getDb } from './db';
import { subscribers, marketMetrics } from './schema';
import { getBasicEmailHtml, getProEmailHtml, getExpertEmailHtml } from './templates/email-templates';
import { eq, desc } from 'drizzle-orm';

export interface Env {
    DATABASE_URL: string;
    STRIPE_KEY: string;
    BREVO_API_KEY: string;
    GEMINI_KEY: string;
    FRED_KEY: string;
    AV_KEY: string;
    ADMIN_EMAIL?: string; // Optional for testing
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // Simple manual trigger endpoint for testing without waiting for Cron
        const url = new URL(request.url);
        if (url.pathname === '/trigger-update') {
            try {
                const data = await fetchMarketData(env);

                // 1. Generate Sentiment
                const sentiment = await generateMarketSentiment(data, env);
                console.log("DEBUG: Final Sentiment for Email:", sentiment);
                data.sentiment = sentiment;

                // 2. Save to DB
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
                    aggregateRiskScore: data.aggregateRiskScore,

                    rawJson: data
                });

                // 3. Test Email Send - Send samples of all 3 tiers to admin if configured
                let emailResult = { success: true, count: 0, errors: [] as string[] };

                if (env.ADMIN_EMAIL) {
                    // Pre-generate charts for Expert test
                    let expertRiskChartUrl = "";
                    let globalChartUrl = "";

                    try {
                        const riskHistoryResults = await db.select({ score: marketMetrics.aggregateRiskScore })
                            .from(marketMetrics)
                            .orderBy(desc(marketMetrics.createdAt))
                            .limit(30);
                        const scores = riskHistoryResults.map(r => r.score || 0).reverse();
                        if (scores.length === 0) scores.push(data.aggregateRiskScore);
                        expertRiskChartUrl = generateExpertRiskChartUrl(scores);

                        if (data.spyHistory && data.spyHistory.length > 0) {
                            const lastVal = data.spyHistory[0];
                            const prediction = lastVal * (1 + (data.oneMonthAhead / 100));
                            globalChartUrl = generateTrendChartUrl('S&P 500 Trend', data.spyHistory.slice(0, 30).reverse(), prediction, lastVal * 1.05, lastVal * 0.95);
                        }
                    } catch (e) { console.error("Chart generation failed for test", e); }

                    const tests = [
                        { name: "Basic", html: getBasicEmailHtml(data) },
                        { name: "Pro", html: getProEmailHtml(data) },
                        { name: "Expert", html: getExpertEmailHtml(data, globalChartUrl, expertRiskChartUrl) }
                    ];

                    for (const test of tests) {
                        const res = await sendEmail(env.ADMIN_EMAIL, `[TEST] ${test.name} Market Report`, test.html, env);
                        if (res.success) emailResult.count++;
                        else emailResult.errors.push(`${test.name}: ${res.error}`);
                    }
                } else {
                    console.log("Skipping test emails: ADMIN_EMAIL not set");
                }

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
            console.log("DEBUG: Generated Sentiment:", sentiment);
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
                aggregateRiskScore: data.aggregateRiskScore,

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

            // Expert Risk Chart History
            let expertRiskChartUrl = "";
            try {
                const riskHistoryResults = await db.select({ score: marketMetrics.aggregateRiskScore })
                    .from(marketMetrics)
                    .orderBy(desc(marketMetrics.createdAt))
                    .limit(30);

                // Extract scores and ensure the current one is included at the end
                const scores = riskHistoryResults.map(r => r.score || 0).reverse();
                // If this is the very first run, history might be empty, so at least show current
                if (scores.length === 0) scores.push(data.aggregateRiskScore);

                expertRiskChartUrl = generateExpertRiskChartUrl(scores);
            } catch (e) {
                console.error("Failed to generate Expert Risk Chart:", e);
            }

            // Batch Sending Logic
            const BATCH_SIZE = 20;
            let successCount = 0;
            let failCount = 0;

            for (let i = 0; i < activeSubscribers.length; i += BATCH_SIZE) {
                const batch = activeSubscribers.slice(i, i + BATCH_SIZE);
                console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(activeSubscribers.length / BATCH_SIZE)}`);

                const results = await Promise.all(batch.map(async (sub) => {
                    try {
                        let html = '';
                        switch (sub.plan) {
                            case 'expert':
                            case 'advanced':
                                html = getExpertEmailHtml(data, globalChartUrl, expertRiskChartUrl);
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
                        return true;
                    } catch (err) {
                        console.error(`Failed to email ${sub.email}:`, err);
                        return false;
                    }
                }));

                successCount += results.filter(r => r).length;
                failCount += results.filter(r => !r).length;
            }

            console.log(`Email run complete. Sent: ${successCount}, Failed: ${failCount}`);

        } catch (e) {
            console.error("Cron failed:", e);
        }
    },
};
