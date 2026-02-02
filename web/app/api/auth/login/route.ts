import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from 'bcryptjs';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        const user = await db.query.subscribers.findFirst({
            where: eq(subscribers.email, email)
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        if (!user.active) {
            return NextResponse.json({ error: "Subscription is not active" }, { status: 403 });
        }

        // Use bcrypt to compare password with hash
        const isMatch = await bcrypt.compare(password, user.password || '');
        if (!isMatch) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const response = NextResponse.json({ success: true, plan: user.plan });

        // Set secure cookie
        response.cookies.set('crashalert-user', email, {
            path: '/',
            httpOnly: false, // Accessible to clientJS as per current implementation mock, strict would use httpOnly
            maxAge: 86400,
            secure: process.env.NODE_ENV === 'production'
        });

        return response;

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
