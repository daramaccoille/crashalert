import { NextRequest, NextResponse } from "next/server";
import Stripe from 'stripe';
import { db } from "@/lib/db";
import { subscribers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});

export async function POST(req: NextRequest) {
    try {
        // Auth check via cookie
        const authCookie = req.cookies.get('crashalert-user');
        if (!authCookie || !authCookie.value) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const email = authCookie.value;

        // Get user from DB to retrieve stripeId
        const user = await db.query.subscribers.findFirst({
            where: eq(subscribers.email, email)
        });

        if (!user || !user.stripeId) {
            return NextResponse.json({ error: "User or Stripe ID not found" }, { status: 404 });
        }

        const returnUrl = process.env.NEXT_PUBLIC_URL + '/dashboard';

        const session = await stripe.billingPortal.sessions.create({
            customer: user.stripeId,
            return_url: returnUrl,
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error("Portal Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
