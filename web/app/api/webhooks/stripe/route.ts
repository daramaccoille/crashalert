import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { db } from '@/lib/db';
import { subscribers } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { sendEmail } from '@/lib/email';
import bcrypt from 'bcryptjs';

export const runtime = 'edge';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2026-01-28.clover',
    typescript: true,
});

// Map Stripe Price IDs to internal Plan names
// To be effective, these ENV vars must be set in Cloudflare/Vercel
const PRICE_ID_MAP: Record<string, string> = {
    [process.env.STRIPE_PRICE_BASIC || 'price_basic_placeholder']: 'basic',
    [process.env.STRIPE_PRICE_PRO || 'price_pro_placeholder']: 'pro',
    [process.env.STRIPE_PRICE_EXPERT || 'price_expert_placeholder']: 'expert',
};

export async function POST(req: NextRequest) {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature') as string;

    let event: Stripe.Event;

    try {
        event = await stripe.webhooks.constructEventAsync(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET!
        );
    } catch (err: any) {
        return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            console.log('Webhook received: checkout.session.completed');
            const session = event.data.object as Stripe.Checkout.Session;
            const email = session.customer_details?.email;
            const planType = session.metadata?.plan || 'basic';

            console.log(`Processing subscription for: ${email}, Plan: ${planType}`);

            if (email) {
                console.log(`Payment successful for ${email} - Plan: ${planType}`);

                // Generate simple random password
                const generatedPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
                const hashedPassword = await bcrypt.hash(generatedPassword, 10);

                try {
                    await db.insert(subscribers).values({
                        email: email,
                        stripeId: session.customer as string,
                        active: true,
                        plan: planType,
                        password: hashedPassword
                    }).onConflictDoUpdate({
                        target: subscribers.email,
                        set: {
                            active: true,
                            stripeId: session.customer as string,
                            plan: planType,
                            password: hashedPassword
                        }
                    });

                    // Send Welcome Email with Password
                    const welcomeHtml = `
                        <div style="font-family: sans-serif; color: #333; max-width: 600px;">
                            <h1>Welcome to CrashAlert ${planType.charAt(0).toUpperCase() + planType.slice(1)}!</h1>
                            <p>Your subscription is now active.</p>
                            <div style="background: #f4f4f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 14px; color: #666;">Your Login Credentials:</p>
                                <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
                                <p style="margin: 0;"><strong>Password:</strong> <code style="background: #fff; padding: 4px 8px; border-radius: 4px; border: 1px solid #ddd;">${generatedPassword}</code></p>
                            </div>
                            <p>Please login at <a href="https://crashalert.online/login">https://crashalert.online/login</a> to access your dashboard.</p>
                        </div>
                    `;

                    const emailResult = await sendEmail(email, "Your CrashAlert Account Access", welcomeHtml);
                    if (emailResult.success) {
                        console.log(`Welcome email sent to ${email}`);
                    } else {
                        console.error(`Failed to send welcome email to ${email}: ${emailResult.error}`);
                    }

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

            // Determine Plan from Price ID (more robust than metadata)
            let planType = subscription.metadata?.plan;

            if (subscription.items && subscription.items.data.length > 0) {
                const priceId = subscription.items.data[0].price.id;
                // Check if we have a direct mapping
                if (PRICE_ID_MAP[priceId]) {
                    planType = PRICE_ID_MAP[priceId];
                }
                // Fallback: Check if the product metadata has the plan name (if configured in Stripe)
                // This would require an extra API call which we want to avoid in a webhook if possible,
                // but we can trust the metadata if it exists on the subscription object as a fallback.
            }

            console.log(`Subscription updated for ${stripeCustomerId} - Status: ${status}, Plan: ${planType}`);

            try {
                // Active statuses: active, trialing
                const isActive = status === 'active' || status === 'trialing';

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
