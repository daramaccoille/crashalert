"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

function LoginContent() {
    const searchParams = useSearchParams();
    const plan = searchParams.get('plan');
    const initialEmail = searchParams.get('email') || "";

    const router = useRouter();
    const [email, setEmail] = useState(initialEmail);
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await signIn("credentials", {
                email,
                password,
                redirect: false
            });

            if (res?.error) {
                alert(res.error || "Login failed");
                setLoading(false);
                return;
            }

            if (plan) {
                router.push(`/checkout?plan=${plan}`);
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            console.error("Login error", err);
            alert("Connection failed");
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 glass-panel rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
                <p className="text-zinc-400">
                    {plan ? `Sign in to continue to ${plan.charAt(0).toUpperCase() + plan.slice(1)} plan.` : "Sign in to access your dashboard."}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition backdrop-blur-sm"
                        placeholder="you@example.com"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition backdrop-blur-sm"
                        placeholder="••••••••"
                        required
                    />
                </div>

                <button type="submit" disabled={loading} className={`w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3.5 rounded-lg transition shadow-[0_0_15px_rgba(234,179,8,0.2)] ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                    {loading ? 'Signing in...' : 'Sign In'}
                </button>
            </form>

            <div className="mt-8 text-center text-sm text-zinc-500">
                Don't have an account? <Link href="/#pricing" className="text-yellow-500 hover:text-yellow-400">Sign up</Link>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden px-4">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/10 via-[#050505] to-[#050505] pointer-events-none"></div>

            {/* Home Link */}
            <Link href="/" className="absolute top-8 left-8 text-zinc-400 hover:text-white transition flex items-center gap-2 z-20">
                ← Back to Home
            </Link>

            <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
                <LoginContent />
            </Suspense>
        </main>
    );
}
