import { fetchMarketData } from './market';
import { generateTrendChartUrl, generateExpertRiskChartUrl, generateMetricChartUrl } from './utils/charts';
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
                        const history = await db.select()
                            .from(marketMetrics)
                            .orderBy(desc(marketMetrics.createdAt))
                            .limit(30);

                        const riskScores = history.map(r => r.aggregateRiskScore || 0).reverse();
                        if (riskScores.length === 0) riskScores.push(data.aggregateRiskScore);
                        expertRiskChartUrl = generateExpertRiskChartUrl(riskScores);

                        if (data.spyHistory && data.spyHistory.length > 0) {
                            const lastVal = data.spyHistory[0];
                            const prediction = lastVal * (1 + (data.oneMonthAhead / 100));
                            globalChartUrl = generateTrendChartUrl('S&P 500 Trend', data.spyHistory.slice(0, 30).reverse(), prediction, lastVal * 1.05, lastVal * 0.95);
                        }
                    } catch (e) { console.error("Chart generation failed for test", e); }

                    // Generate 9 indicator charts for Expert test
                    const metricCharts: Record<string, string> = {};
                    try {
                        const history = await db.select().from(marketMetrics).orderBy(desc(marketMetrics.createdAt)).limit(30);
                        const metrics = [
                            { label: 'VIX', key: 'vix' as const },
                            { label: 'Spread', key: 'yieldSpread' as const },
                            { label: 'P/E', key: 'sp500pe' as const },
                            { label: 'Liquidity', key: 'liquidity' as const },
                            { label: 'Junk', key: 'junkBondSpread' as const },
                            { label: 'Debt', key: 'marginDebt' as const },
                            { label: 'Insider', key: 'insiderActivity' as const },
                            { label: 'Macro', key: 'cfnai' as const },
                            { label: 'Signal', key: 'oneMonthAhead' as const }
                        ];

                        metrics.forEach(m => {
                            const values = history.map(h => Number(h[m.key]) || 0).reverse();
                            if (values.length === 0) values.push(Number(data[m.key as keyof typeof data]) || 0);
                            metricCharts[m.label] = generateMetricChartUrl(values);
                        });
                    } catch (e) { console.error("Indicator charts failed", e); }

                    const tests = [
                        { name: "Basic", html: getBasicEmailHtml(data) },
                        { name: "Pro", html: getProEmailHtml(data) },
                        { name: "Expert", html: getExpertEmailHtml(data, globalChartUrl, expertRiskChartUrl, metricCharts) }
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

            // Expert Visuals (Risk Trend + 9 Indicators)
            let expertRiskChartUrl = "";
            const metricCharts: Record<string, string> = {};
            try {
                const history = await db.select().from(marketMetrics).orderBy(desc(marketMetrics.createdAt)).limit(30);

                // 1. Risk Trend Chart
                const riskScores = history.map(h => h.aggregateRiskScore || 0).reverse();
                if (riskScores.length === 0) riskScores.push(data.aggregateRiskScore);
                expertRiskChartUrl = generateExpertRiskChartUrl(riskScores);

                // 2. 9 Individual Indicator Sparklines
                const metrics = [
                    { label: 'VIX', key: 'vix' as const },
                    { label: 'Spread', key: 'yieldSpread' as const },
                    { label: 'P/E', key: 'sp500pe' as const },
                    { label: 'Liquidity', key: 'liquidity' as const },
                    { label: 'Junk', key: 'junkBondSpread' as const },
                    { label: 'Debt', key: 'marginDebt' as const },
                    { label: 'Insider', key: 'insiderActivity' as const },
                    { label: 'Macro', key: 'cfnai' as const },
                    { label: 'Signal', key: 'oneMonthAhead' as const }
                ];
                metrics.forEach(m => {
                    const values = history.map(h => Number(h[m.key]) || 0).reverse();
                    if (values.length === 0) values.push(Number(data[m.key as keyof typeof data]) || 0);
                    metricCharts[m.label] = generateMetricChartUrl(values);
                });
            } catch (e) {
                console.error("Failed to generate Expert visuals:", e);
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
                                html = getExpertEmailHtml(data, globalChartUrl, expertRiskChartUrl, metricCharts);
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
