import { db } from "@/lib/db";
import { subscribers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, alerts } = body;

        if (!email || !Array.isArray(alerts)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        if (alerts.length > 8) {
            return NextResponse.json({ error: "Max 8 alerts allowed" }, { status: 400 });
        }

        // Update DB
        await db.update(subscribers)
            .set({ selectedAlerts: alerts })
            .where(eq(subscribers.email, email));

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
