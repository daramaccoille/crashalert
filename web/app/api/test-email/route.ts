import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        console.log("Test Email Route Triggered - Production Check");
        console.log("Checking Environment Config...");

        const key = process.env.BREVO_API_KEY;
        const keyStatus = key ? `Present (starts with ${key.substring(0, 5)}...)` : "Missing";
        console.log("API Key Status:", keyStatus);

        const result = await sendEmail(
            "darawoods@yahoo.com", // Keeping the user's email for testing
            "CrashAlert In-App Test",
            "<h1>This is a test from the Next.js App</h1><p>If you see this, the web app can send emails.</p>"
        );

        if (result.success) {
            return NextResponse.json({ success: true, message: "Email sent successfully", keyStatus });
        } else {
            return NextResponse.json({ success: false, error: result.error || "Email function failed", keyStatus }, { status: 500 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
