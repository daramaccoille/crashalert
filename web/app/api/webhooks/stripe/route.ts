import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { subscribers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'edge';

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

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            const email = session.customer_details?.email;
            const planType = session.metadata?.plan || 'basic';

            if (email) {
                console.log(`Payment successful for ${email} - Plan: ${planType}`);
                try {
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
            break;
        }

        case 'customer.subscription.updated': {
            const subscription = event.data.object as Stripe.Subscription;
            const stripeCustomerId = subscription.customer as string;
            const status = subscription.status;
            // Check if metadata has plan info (it should carry over from checkout if configured properly)
            // or we just trust the status update.
            const planType = subscription.metadata?.plan;

            console.log(`Subscription updated for ${stripeCustomerId} - Status: ${status}`);

            try {
                // If the status is active, we ensure they are active.
                // If past_due, unpaid, or canceled, we might want to deactivate.
                const isActive = status === 'active';

                const updateData: any = { active: isActive };
                if (planType) updateData.plan = planType;

                await db.update(subscribers)
                    .set(updateData)
                    .where(eq(subscribers.stripeId, stripeCustomerId));
            } catch (err) {
                console.error('Error handling subscription.updated:', err);
                return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
            }
            break;
        }

        case 'customer.subscription.deleted': {
            const subscription = event.data.object as Stripe.Subscription;
            const stripeCustomerId = subscription.customer as string;

            console.log(`Subscription deleted/canceled for ${stripeCustomerId}`);

            try {
                await db.update(subscribers)
                    .set({ active: false })
                    .where(eq(subscribers.stripeId, stripeCustomerId));
            } catch (err) {
                console.error('Error handling subscription.deleted:', err);
                return NextResponse.json({ error: 'DB Update Failed' }, { status: 500 });
            }
            break;
        }
    }

    return NextResponse.json({ received: true });
}
