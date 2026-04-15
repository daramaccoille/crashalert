"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const router = useRouter();

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className="w-full max-w-md p-8 glass-panel rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                <h1 className="text-2xl font-bold text-white mb-4">Invalid Reset Link</h1>
                <p className="text-zinc-400 mb-6">No reset token was provided.</p>
                <Link href="/login" className="text-yellow-500 hover:text-yellow-400">Return to Sign In</Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password !== confirmPassword) {
            alert("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, newPassword: password })
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || "Failed to reset password");
                return;
            }

            setSuccess(true);
        } catch (err) {
            console.error("Reset error", err);
            alert("Connection failed");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="w-full max-w-md p-8 glass-panel rounded-2xl bg-zinc-900/50 border border-zinc-800 text-center">
                <div className="mb-6 mx-auto w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex justify-center items-center text-3xl">✓</div>
                <h1 className="text-2xl font-bold text-white mb-2">Password Reset Successful</h1>
                <p className="text-zinc-400 mb-8">Your password has been securely updated.</p>
                <Link href="/login" className="w-full block bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3.5 rounded-lg transition shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                    Sign In to Continue
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md p-8 glass-panel rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="mb-8 text-center">
                <h1 className="text-3xl font-bold text-white mb-2">Create New Password</h1>
                <p className="text-zinc-400">Please enter a new securely strong password.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">New Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition backdrop-blur-sm"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-2">Confirm Password</label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-yellow-500/50 transition backdrop-blur-sm"
                        placeholder="••••••••"
                        required
                        minLength={6}
                    />
                </div>

                <button type="submit" disabled={loading} className={`w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3.5 rounded-lg transition shadow-[0_0_15px_rgba(234,179,8,0.2)] ${loading ? 'opacity-50 cursor-wait' : ''}`}>
                    {loading ? 'Updating...' : 'Reset Password'}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-[#050505] relative overflow-hidden px-4">
            {/* Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-900/10 via-[#050505] to-[#050505] pointer-events-none"></div>

            {/* Home Link */}
            <Link href="/" className="absolute top-8 left-8 text-zinc-400 hover:text-white transition flex items-center gap-2 z-20">
                ← Back to Home
            </Link>

            <Suspense fallback={<div className="text-zinc-500">Loading...</div>}>
                <ResetPasswordContent />
            </Suspense>
        </main>
    );
}
