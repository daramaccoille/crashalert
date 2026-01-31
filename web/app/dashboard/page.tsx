"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

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
    { id: "vix", label: "VIX (Volatility)", key: "vix", suffix: "", threshold: 20, color: "#ef4444" },
    { id: "yield", label: "Yield Spread", key: "yieldSpread", suffix: "%", threshold: 0, invert: true, color: "#eab308" },
    { id: "pe", label: "S&P 500 P/E", key: "sp500pe", suffix: "", threshold: 25, color: "#3b82f6" },
    { id: "liq", label: "Liquidity", key: "liquidity", suffix: "T", threshold: 5, invert: true, color: "#10b981" },
    { id: "junk", label: "Junk Bond Spread", key: "junkBondSpread", suffix: "bps", threshold: 500, color: "#a855f7" },
    { id: "cfnai", label: "CFNAI (Macro)", key: "cfnai", suffix: "", threshold: -0.7, invert: true, color: "#f97316" },
];

export default function Dashboard() {
    const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
    const [history, setHistory] = useState<MarketMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["vix", "yield"]);

    useEffect(() => {
        async function fetchData() {
            try {
                // Fetch latest
                const resLatest = await fetch('/api/metrics');
                if (resLatest.ok) {
                    const data = await resLatest.json();
                    setMetrics(data);
                }

                // Fetch history
                const resHistory = await fetch('/api/metrics/history');
                if (resHistory.ok) {
                    const historyData = await resHistory.json();
                    // Process history for chart (ensure numbers)
                    const processed = historyData.map((item: any) => ({
                        ...item,
                        createdAt: new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                        vix: Number(item.vix),
                        yieldSpread: Number(item.yieldSpread),
                        sp500pe: Number(item.sp500pe),
                        liquidity: Number(item.liquidity),
                        junkBondSpread: Number(item.junkBondSpread),
                        cfnai: Number(item.cfnai)
                    }));
                    setHistory(processed);
                }
            } catch (e) {
                console.error("Failed to load market data", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    const toggleMetric = (id: string) => {
        if (selectedMetrics.includes(id)) {
            setSelectedMetrics(selectedMetrics.filter(m => m !== id));
        } else {
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
                        const isSelected = true; // All charts are always "selected" now

                        return (
                            <div
                                key={def.id}
                                className={`group relative p-6 rounded-xl border transition duration-300 h-[300px] flex flex-col justify-between ${isSelected
                                    ? 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs font-mono uppercase tracking-wider px-2 py-1 rounded ${isSelected ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-800 text-zinc-500'
                                        }`}>
                                        {def.label}
                                    </span>
                                </div>
                                <div className="flex items-baseline gap-2 mb-4">
                                    <h3 className={`text-3xl font-bold ${metrics ? getRiskColor(val, def.threshold, def.invert) : 'text-zinc-400'}`}>
                                        {displayVal}<span className="text-base font-normal text-zinc-500 ml-1">{def.suffix}</span>
                                    </h3>
                                </div>

                                <div className="flex-1 w-full min-h-[100px]">
                                    {history.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                            <LineChart data={history}>
                                                <XAxis dataKey="createdAt" hide />
                                                <YAxis hide domain={['auto', 'auto']} />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', fontSize: '12px' }}
                                                    itemStyle={{ color: '#e4e4e7' }}
                                                    labelStyle={{ display: 'none' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey={def.key}
                                                    stroke={def.color}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    isAnimationActive={false}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-xs text-zinc-600 flex items-center justify-center h-full">No History</div>
                                    )}
                                </div>

                                <p className="text-xs text-zinc-600 mt-4 text-right">
                                    Risk Threshold: {def.invert ? '<' : '>'}{def.threshold}
                                </p>
                            </div>
                        );
                    })}
                </div>

            </main>
        </div>
    );
}
