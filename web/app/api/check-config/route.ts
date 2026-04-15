import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/drizzle/schema";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    // TEMPORARILY DISABLED FOR DEBUGGING
    /*
    const { searchParams } = new URL(req.url);
    const providedKey = searchParams.get('key');
    const authSecret = process.env.AUTH_SECRET || "";
    const expectedKey = process.env.DEBUG_KEY || authSecret.substring(0, 8);

    if (!expectedKey || providedKey !== expectedKey) {
        return NextResponse.json({ 
            error: "Unauthorized. Please provide the correct ?key= parameter." 
        }, { status: 401 });
    }
    */

    const report: Record<string, any> = {
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        runtime: 'edge',
        config: {
            NEXT_PUBLIC_URL: {
                value: process.env.NEXT_PUBLIC_URL || "NOT SET",
                matchesOrigin: process.env.NEXT_PUBLIC_URL === new URL(req.url).origin
            }
        },
        secrets: {}
    };

    const secretKeys = [
        'BREVO_API_KEY',
        'AUTH_SECRET',
        'STRIPE_SECRET_KEY',
        'DATABASE_URL',
        'FRED_KEY',
        'AV_KEY'
    ];

    for (const key of secretKeys) {
        const value = process.env[key];
        report.secrets[key] = {
            status: value ? "SET" : "MISSING",
            length: value ? value.length : 0,
            preview: value ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}` : null
        };
    }

    // Brevo Ping Test
    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
        try {
            const brevoRes = await fetch('https://api.brevo.com/v3/account', {
                headers: { 'api-key': brevoKey, 'accept': 'application/json' }
            });
            report.brevoPing = {
                status: brevoRes.status,
                ok: brevoRes.ok,
                message: brevoRes.statusText
            };
        } catch (e: any) {
            report.brevoPing = { status: "ERROR", error: e.message };
        }
    }

    // Database Connection Test
    try {
        const start = Date.now();
        await db.query.subscribers.findFirst();
        report.database = {
            status: "CONNECTED",
            responseTimeMs: Date.now() - start
        };
    } catch (err: any) {
        report.database = {
            status: "ERROR",
            error: err.message || String(err)
        };
    }

    return NextResponse.json(report);
}
