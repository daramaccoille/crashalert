"use client";

import { useState } from "react";
import Link from "next/link";

const AVAILABLE_METRICS = [
    { id: "vix", label: "VIX Volatility Index", category: "Risk" },
    { id: "yield_spread", label: "10Y-2Y Yield Spread", category: "Bonds" },
    { id: "sp500_pe", label: "S&P 500 P/E Ratio", category: "Valuation" },
    { id: "liquidity", label: "Global Liquidity Index", category: "Macro" },
    { id: "junk_spread", label: "Junk Bond Spread", category: "Credit" },
    { id: "put_call", label: "Put/Call Ratio", category: "Sentiment" },
    { id: "dxy", label: "US Dollar Index (DXY)", category: "Forex" },
    { id: "oil", label: "Crude Oil Prices", category: "Commodities" },
    { id: "btc_corr", label: "Bitcoin Correlation", category: "Crypto" },
];

export default function Dashboard() {
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["vix", "yield_spread", "sp500_pe"]);

    const toggleMetric = (id: string) => {
        if (selectedMetrics.includes(id)) {
            setSelectedMetrics(selectedMetrics.filter(m => m !== id));
        } else {
            if (selectedMetrics.length >= 5) {
                alert("You can select up to 5 metrics on your plan.");
                return;
            }
            setSelectedMetrics([...selectedMetrics, id]);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex flex-col">
            {/* Nav */}
            <header className="border-b border-white/5 bg-black/50 backdrop-blur-md p-4 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="font-bold text-xl tracking-tighter">
                        CRASHALERT<span className="text-yellow-500">.</span> <span className="text-sm font-normal text-zinc-500 ml-2">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-400">Welcome, <strong>Expert User</strong></span>
                        <Link href="/" className="text-xs border border-white/10 px-3 py-1.5 rounded hover:bg-white/5 transition">Sign Out</Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold mb-2">Market Overview</h1>
                    <p className="text-zinc-400">Customise your view by selecting key metrics below.</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {AVAILABLE_METRICS.map((metric) => (
                        <div
                            key={metric.id}
                            onClick={() => toggleMetric(metric.id)}
                            className={`cursor-pointer group relative p-6 rounded-xl border transition duration-300 ${selectedMetrics.includes(metric.id)
                                    ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                                }`}
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className={`text-xs font-mono uppercase tracking-wider px-2 py-1 rounded ${selectedMetrics.includes(metric.id) ? 'bg-yellow-500/20 text-yellow-500' : 'bg-zinc-800 text-zinc-500'
                                    }`}>
                                    {metric.category}
                                </span>
                                {selectedMetrics.includes(metric.id) && (
                                    <span className="text-yellow-500">✓</span>
                                )}
                            </div>
                            <h3 className="text-lg font-bold mb-1">{metric.label}</h3>
                            <p className="text-sm text-zinc-500">Click to {selectedMetrics.includes(metric.id) ? 'remove' : 'add'} to watchlist</p>
                        </div>
                    ))}
                </div>

                {/* Placeholder for Charts/Data */}
                <div className="p-8 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center justify-center h-64 text-zinc-500">
                    Real-time data charts would render here based on your selection.
                </div>

            </main>
        </div>
    );
}
