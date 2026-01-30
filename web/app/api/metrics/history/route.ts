import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { marketMetrics } from '@/drizzle/schema';
import { desc } from 'drizzle-orm';

export const runtime = 'edge';

export async function GET() {
    try {
        // Fetch last 30 records for trend analysis
        const history = await db.select()
            .from(marketMetrics)
            .orderBy(desc(marketMetrics.createdAt))
            .limit(30);

        // Reverse to show oldest to newest in charts
        return NextResponse.json(history.reverse());
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
