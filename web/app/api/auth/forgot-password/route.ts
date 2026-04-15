import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { sign, getSecret } from "@/lib/session";
import { sendEmail } from "@/lib/email";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: "Email is required" }, { status: 400 });
        }

        const user = await db.query.subscribers.findFirst({
            where: eq(subscribers.email, email)
        });

        // Always return success even if user not found to prevent email enumeration
        if (!user) {
            return NextResponse.json({ success: true, message: "If an account exists, a reset link was sent." });
        }

        // Generate a reset token valid for 15 minutes
        const expiresAt = Date.now() + 15 * 60 * 1000;
        const payload = `${email}:${expiresAt}`;
        const token = await sign(payload, getSecret());

        const resetLink = `${process.env.NEXT_PUBLIC_URL || requestOrigin(req)}/reset-password?token=${encodeURIComponent(token)}`;

        // Send email
        const html = `
            <h2>Password Reset Request</h2>
            <p>You requested an account password reset on CrashAlert.</p>
            <p>Click the link below to securely reset your password. This link is valid for 15 minutes.</p>
            <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#eab308;color:#000;text-decoration:none;font-weight:bold;border-radius:5px;">Reset Password</a>
            <p><small>If you did not request this, you can safely ignore this email.</small></p>
        `;

        await sendEmail(email, "Reset your CrashAlert Password", html);

        return NextResponse.json({ success: true, message: "If an account exists, a reset link was sent." });

    } catch (e: any) {
        console.error("Forgot password API error:", e);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}

function requestOrigin(req: NextRequest) {
    // Basic fallback to detect origin in edge
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('host') || 'localhost:3000';
    return `${protocol}://${host}`;
}
