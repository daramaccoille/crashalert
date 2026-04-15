import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { verify, getSecret } from "@/lib/session";
import bcrypt from "bcryptjs";

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { token, newPassword } = await req.json();

        if (!token || !newPassword) {
            return NextResponse.json({ error: "Token and new password are required" }, { status: 400 });
        }

        // Verify token
        const payload = await verify(token, getSecret());
        if (!payload) {
            return NextResponse.json({ error: "Invalid or corrupted reset token." }, { status: 400 });
        }

        const [email, expiresAtStr] = payload.split(':');
        const expiresAt = parseInt(expiresAtStr, 10);

        if (isNaN(expiresAt) || Date.now() > expiresAt) {
            return NextResponse.json({ error: "Token has expired. Please request a new link." }, { status: 400 });
        }

        // Verify user exists
        const user = await db.query.subscribers.findFirst({
            where: eq(subscribers.email, email)
        });

        if (!user) {
            return NextResponse.json({ error: "User associated with this token no longer exists." }, { status: 400 });
        }

        // Hash new password and update
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await db.update(subscribers)
            .set({ password: hashedPassword })
            .where(eq(subscribers.email, email));

        return NextResponse.json({ success: true, message: "Password updated successfully" });

    } catch (e: any) {
        console.error("Reset password error:", e);
        return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
    }
}
