"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");

    return (
        <div className="text-center max-w-lg px-6">
            <div className="glass-panel p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-500/20">
                    <span className="text-4xl">🎉</span>
                </div>

                <h1 className="text-3xl font-bold text-white mb-4">Subscription Confirmed!</h1>
                <p className="text-zinc-400 mb-8 leading-relaxed">
                    Thank you for joining CrashAlert. Your payment was successful. We have sent a confirmation email to your inbox.
                </p>

                {sessionId && (
                    <div className="mb-6 p-3 bg-white/5 rounded text-xs text-zinc-600 font-mono break-all">
                        Session ID: {sessionId.slice(0, 10)}...
                    </div>
                )}

                <div className="flex flex-col gap-4">
                    <Link href="/dashboard" className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 rounded-lg transition shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        Go to Dashboard
                    </Link>
                    <Link href="/" className="text-sm text-zinc-500 hover:text-white transition">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden text-white">
            {/* Background Effects */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-emerald-900/10 via-[#050505] to-[#050505] pointer-events-none"></div>

            <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
                <SuccessContent />
            </Suspense>
        </main>
    );
}
