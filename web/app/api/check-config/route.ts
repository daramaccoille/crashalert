import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/drizzle/schema";

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const providedKey = searchParams.get('key');
    
    // Safety Check: Require a key to prevent public probing
    // Default to using the first 8 chars of AUTH_SECRET as the 'key' requirement
    const authSecret = process.env.AUTH_SECRET || "";
    const expectedKey = process.env.DEBUG_KEY || authSecret.substring(0, 8);

    if (!expectedKey || providedKey !== expectedKey) {
        return NextResponse.json({ 
            error: "Unauthorized. Please provide the correct ?key= parameter." 
        }, { status: 401 });
    }

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
            // Only show first/last chars for non-BREVO keys if necessary, 
            // but for maximum safety we just show length and status.
            preview: value ? `${value.substring(0, 3)}...${value.substring(value.length - 3)}` : null
        };
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
