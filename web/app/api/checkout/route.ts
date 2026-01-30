import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { subscribers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
export const runtime = 'edge';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover', // Using recent version, ensure matches package
    typescript: true,
});

export async function POST(req: NextRequest) {
    try {
        const { email, plan } = await req.json();

        if (!email || !plan) {
            return NextResponse.json({ error: 'Email and plan are required' }, { status: 400 });
        }

        // 1. Check if user is already active
        const existingSubscriber = await db.query.subscribers.findFirst({
            where: eq(subscribers.email, email),
        });

        if (existingSubscriber && existingSubscriber.active) {
            // User is already active. 
            // In a real app, we might redirect them to a billing portal or upgrade page.
            // For now, return an error to the frontend.
            return NextResponse.json({
                error: 'You already have an active subscription. Please login to manage it.'
            }, { status: 409 });
        }


        // 2. Map plan to Price ID
        let priceId;
        console.log('Received plan:', plan);
        console.log('Env Vars Check:', {
            BASIC: process.env.CRASH_ALERT_PRICE_ID_BASIC ? 'Loaded' : 'Missing',
            PRO: process.env.CRASH_ALERT_PRICE_ID_PRO ? 'Loaded' : 'Missing',
            ADVANCED: process.env.CRASH_ALERT_PRICE_ID_ADVANCED ? 'Loaded' : 'Missing'
        });

        switch (plan) {
            case 'basic':
                priceId = process.env.CRASH_ALERT_PRICE_ID_BASIC;
                break;
            case 'pro':
                priceId = process.env.CRASH_ALERT_PRICE_ID_PRO;
                break;
            case 'expert':
                priceId = process.env.CRASH_ALERT_PRICE_ID_ADVANCED;
                break;
            default:
                return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
        }

        if (!priceId) {
            console.error(`Price ID missing for plan: ${plan}`);
            return NextResponse.json({ error: 'Configuration error: Plan not available' }, { status: 500 });
        }

        // 3. Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer_email: email, // Pre-fill email
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_URL}/`,
            metadata: {
                plan: plan,
            },
            // proper handling for existing customers could be added here if we had the stripe_customer_id
        });

        return NextResponse.json({ url: session.url });

    } catch (error: any) {
        console.error('Checkout Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
