import { fetchMarketData } from './market';
import { generateTrendChartUrl } from './utils/charts';
import { sendEmail } from './utils/email';
import { getDb } from './db';
import { marketMetrics } from './schema';

export interface Env {
    DATABASE_URL: string;
    STRIPE_KEY: string;
    BREVO_API_KEY: string;
    GEMINI_KEY: string;
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
                    rawJson: data
                });

                // Test Email Send
                await sendEmail(
                    "dara@crashalert.online",
                    "CrashAlert Update Test",
                    "<p>Market data fetched and saved successfully.</p><pre>" + JSON.stringify(data, null, 2) + "</pre>",
                    env
                );

                return new Response(JSON.stringify({ success: true, data }, null, 2), { headers: { 'content-type': 'application/json' } });
            } catch (e: any) {
                return new Response(`Error: ${e.message}`, { status: 500 });
            }
        }

        return new Response("CrashAlert Worker is running. Endpoints: /trigger-update");
    },

    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
        console.log("Cron triggered at", new Date().toISOString());
        try {
            const data = await fetchMarketData(env);
            console.log("Market Data Fetched:", JSON.stringify(data));

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
                rawJson: data
            });

            // 2. Determine Emails to send (Logic to be expanded)
            // ExampleChart logic...

        } catch (e) {
            console.error("Cron failed:", e);
        }
    },
};

