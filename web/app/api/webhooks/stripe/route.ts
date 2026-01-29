import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { subscribers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover', // Updated to match SDK types
    typescript: true,
});

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        const email = session.customer_details?.email;

        // Check metadata or client_reference_id for Plan Type if passed
        const planType = session.metadata?.plan || 'basic';

        if (email) {
            console.log(`Payment successful for ${email} - Plan: ${planType}`);

            try {
                // Upsert subscriber
                // If they exist, update to active and set plan.
                // If not, create them.
                await db.insert(subscribers).values({
                    email: email,
                    stripeId: session.customer as string,
                    active: true,
                    plan: planType
                }).onConflictDoUpdate({
                    target: subscribers.email,
                    set: {
                        active: true,
                        stripeId: session.customer as string,
                        plan: planType
                    }
                });
            } catch (dbError) {
                console.error('DB Update Failed:', dbError);
                return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
            }
        }
    }

    return NextResponse.json({ received: true });
}
