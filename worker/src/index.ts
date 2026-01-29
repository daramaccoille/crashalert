import { fetchMarketData } from './market';
import { generateTrendChartUrl } from './utils/charts';
import { sendEmail } from './utils/email';

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

                // Test Email Send
                await sendEmail(
                    "metaldetectorsonline1@gmail.com ", // Keeping this hardcoded for your test
                    "CrashAlert Update Test",
                    "<p>Market data fetched successfully.</p><pre>" + JSON.stringify(data, null, 2) + "</pre>",
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

            // Example: Generate VIX Chart for Enterprise users
            // Mock History: 
            const mockHistory = [14, 15, 14.5, 16, 15.8, 16.2, 16.5];
            const prediction = 17.2;
            const upper = 18.5;
            const lower = 15.0;

            const chartUrl = generateTrendChartUrl("VIX Trend", mockHistory, prediction, upper, lower);
            console.log("Generated Chart URL:", chartUrl);

            // 1. Save to DB
            // 2. Determine Emails to send
            // 3. Send Emails via Resend (injecting chartUrl for Enterprise)

        } catch (e) {
            console.error("Cron failed:", e);
        }
    },
};
