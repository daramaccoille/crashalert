"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface MarketMetrics {
    vix: number;
    yieldSpread: string;
    sp500pe: string;
    liquidity: string;
    junkBondSpread: string;
    marketMode: string;
    marginDebt: string;
    insiderActivity: string;
    cfnai: string;
    createdAt: string;
}

const METRIC_DEFINITIONS = [
    { id: "vix", label: "VIX (Volatility)", key: "vix", suffix: "", threshold: 20 },
    { id: "yield", label: "Yield Spread", key: "yieldSpread", suffix: "%", threshold: 0, invert: true }, // < 0 is risk
    { id: "pe", label: "S&P 500 P/E", key: "sp500pe", suffix: "", threshold: 25 },
    { id: "liq", label: "Liquidity", key: "liquidity", suffix: "T", threshold: 5, invert: true },
    { id: "junk", label: "Junk Bond Spread", key: "junkBondSpread", suffix: "bps", threshold: 500 },
    { id: "cfnai", label: "CFNAI (Macro)", key: "cfnai", suffix: "", threshold: -0.7, invert: true },
];

export default function Dashboard() {
    const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["vix", "yield", "pe"]);

    useEffect(() => {
        async function fetchMetrics() {
            try {
                const res = await fetch('/api/metrics');
                if (res.ok) {
                    const data = await res.json();
                    setMetrics(data);
                }
            } catch (e) {
                console.error("Failed to load metrics", e);
            } finally {
                setLoading(false);
            }
        }
        fetchMetrics();
    }, []);

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

    const getRiskColor = (val: number, threshold: number, invert = false) => {
        const isRisk = invert ? val < threshold : val > threshold;
        return isRisk ? 'text-red-500' : 'text-green-500';
    };

    if (loading) return <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center">Loading Market Data...</div>;

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
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold mb-2">Market Overview</h1>
                        <p className="text-zinc-400">Real-time risk assessment and indicator tracking.</p>
                    </div>
                    {metrics && (
                        <div className="text-right">
                            <div className="text-sm text-zinc-500">Market Mode</div>
                            <div className={`text-2xl font-black ${metrics.marketMode === 'BULL' ? 'text-green-500' : metrics.marketMode === 'BEAR' ? 'text-red-500' : 'text-yellow-500'}`}>
                                {metrics.marketMode}
                            </div>
                        </div>
                    )}
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                    {METRIC_DEFINITIONS.map((def) => {
                        //@ts-ignore
                        const val = metrics ? Number(metrics[def.key]) : 0;
                        const displayVal = metrics ? val.toFixed(2) : '-';

                        return (
                            <div
                                key={def.id}
                                onClick={() => toggleMetric(def.id)}
                                className={`cursor-pointer group relative p-6 rounded-xl border transition duration-300 ${selectedMetrics.includes(def.id)
                                    ? 'bg-yellow-500/5 border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.1)]'
                                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`text-xs font-mono uppercase tracking-wider px-2 py-1 rounded ${selectedMetrics.includes(def.id) ? 'bg-yellow-500/20 text-yellow-500' : 'bg-zinc-800 text-zinc-500'
                                        }`}>
                                        {def.label}
                                    </span>
                                    {selectedMetrics.includes(def.id) && (
                                        <span className="text-yellow-500">✓</span>
                                    )}
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className={`text-3xl font-bold ${metrics ? getRiskColor(val, def.threshold, def.invert) : 'text-zinc-400'}`}>
                                        {displayVal}<span className="text-base font-normal text-zinc-500 ml-1">{def.suffix}</span>
                                    </h3>
                                </div>
                                <p className="text-xs text-zinc-600 mt-2">
                                    Risk Threshold: {def.invert ? '<' : '>'}{def.threshold}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Selected Chart Area */}
                <div className="p-8 rounded-xl border border-white/10 bg-zinc-900/50 min-h-[300px]">
                    <h3 className="text-lg font-bold mb-4 text-white">Trend Analysis</h3>
                    <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
                        Chart visualization coming in next update.
                        (Mock: {selectedMetrics.join(', ')})
                    </div>
                </div>

            </main>
        </div>
    );
}
