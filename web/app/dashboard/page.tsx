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
    sentiment?: string;
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
            if (selectedMetrics.length >= 8) {
                alert("You can select up to 8 metrics.");
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
                        <button
                            onClick={() => {
                                fetch('/api/portal', { method: 'POST' })
                                    .then(res => res.json())
                                    .then(data => { if (data.url) window.location.href = data.url; })
                                    .catch(err => alert("Failed to load portal"));
                            }}
                            className="text-xs border border-white/10 px-3 py-1.5 rounded hover:bg-white/5 transition mr-2"
                        >
                            Manage Subscription
                        </button>
                        <Link href="/" className="text-xs text-zinc-500 hover:text-white transition">Sign Out</Link>
                    </div>
                </div>
            </header>



            <main className="flex-1 max-w-7xl mx-auto w-full p-6">

                {/* AI Sentiment Banner */}
                {metrics?.sentiment && (
                    <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 flex items-start gap-4">
                        <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500 text-xl">🤖</div>
                        <div>
                            <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-1">AI Market Analyst</h3>
                            <p className="text-zinc-200 text-lg leading-relaxed font-medium">"{metrics.sentiment}"</p>
                        </div>
                    </div>
                )}

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

                {/* Metrics Toggles Grid */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-12">
                    {METRIC_DEFINITIONS.map((def) => {
                        //@ts-ignore
                        const val = metrics ? Number(metrics[def.key]) : 0;
                        const displayVal = metrics ? val.toFixed(2) : '-';
                        const isSelected = selectedMetrics.includes(def.id);

                        return (
                            <div
                                key={def.id}
                                onClick={() => toggleMetric(def.id)}
                                className={`cursor-pointer group relative p-4 rounded-xl border transition duration-200 flex flex-col justify-between ${isSelected
                                    ? 'bg-yellow-500/10 border-yellow-500/50 shadow-[0_0_10px_rgba(234,179,8,0.1)]'
                                    : 'bg-zinc-900/40 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50'
                                    }`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${isSelected ? 'text-yellow-500' : 'text-zinc-500'}`}>
                                        {def.label}
                                    </span>
                                    {isSelected && <span className="text-yellow-500 text-xs">●</span>}
                                </div>
                                <div className="flex items-baseline gap-1">
                                    <h3 className={`text-xl font-bold ${metrics ? getRiskColor(val, def.threshold, def.invert) : 'text-zinc-400'}`}>
                                        {displayVal}<span className="text-xs font-normal text-zinc-500 ml-0.5">{def.suffix}</span>
                                    </h3>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mb-6 border-t border-white/5 pt-6">
                    <h2 className="text-xl font-bold mb-4">Detailed Analysis <span className="text-sm font-normal text-zinc-500 ml-2">({selectedMetrics.length}/8 Selected)</span></h2>
                </div>

                {/* Selected Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    {selectedMetrics.map((metricId) => {
                        const def = METRIC_DEFINITIONS.find(d => d.id === metricId);
                        if (!def) return null;

                        //@ts-ignore
                        const val = metrics ? Number(metrics[def.key]) : 0;
                        const displayVal = metrics ? val.toFixed(2) : '-';

                        return (
                            <div
                                key={def.id}
                                className="group relative p-6 rounded-xl border border-zinc-800 bg-zinc-900/40 h-[350px] flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-lg text-white">{def.label}</h3>
                                        <div className={`text-2xl font-bold mt-1 ${metrics ? getRiskColor(val, def.threshold, def.invert) : 'text-zinc-400'}`}>
                                            {displayVal}<span className="text-sm text-zinc-500 ml-1">{def.suffix}</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-zinc-500">Risk Threshold</p>
                                        <p className="text-xs font-mono text-zinc-400">{def.invert ? '<' : '>'}{def.threshold}</p>
                                    </div>
                                </div>

                                <div className="flex-1 w-full min-h-[0]">
                                    {history.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                            <LineChart data={history}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                                                <XAxis
                                                    dataKey="createdAt"
                                                    stroke="#52525b"
                                                    tick={{ fill: '#71717a', fontSize: 10 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    interval="preserveStartEnd"
                                                />
                                                <YAxis
                                                    stroke="#52525b"
                                                    tick={{ fill: '#71717a', fontSize: 10 }}
                                                    tickLine={false}
                                                    axisLine={false}
                                                    domain={['auto', 'auto']}
                                                    width={30}
                                                />
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', fontSize: '12px' }}
                                                    itemStyle={{ color: '#e4e4e7' }}
                                                    labelStyle={{ color: '#a1a1aa' }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey={def.key}
                                                    stroke={def.color}
                                                    strokeWidth={2}
                                                    dot={false}
                                                    activeDot={{ r: 4, fill: def.color }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <div className="text-xs text-zinc-600 flex items-center justify-center h-full">No History Data Available</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

            </main>
        </div>
    );
}
