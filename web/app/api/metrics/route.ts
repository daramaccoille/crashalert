import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { marketMetrics } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET() {
    try {
        const latestMetrics = await db.select()
            .from(marketMetrics)
            .orderBy(desc(marketMetrics.createdAt))
            .limit(1);

        if (!latestMetrics || latestMetrics.length === 0) {
            return NextResponse.json({ error: "No metrics found" }, { status: 404 });
        }

        return NextResponse.json(latestMetrics[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
