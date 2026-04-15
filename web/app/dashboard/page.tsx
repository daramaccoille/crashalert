"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
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
    oecdValue: string;
    oecdMomentum: string;
    oecdTrend: string;
    sentiment?: string;
    rawJson?: {
        newsStats?: { counts: Record<string, number>, overallLabel: string };
        calendar?: { past: any[], future: any[] };
        [key: string]: any;
    };
    createdAt: string;
}

const METRIC_DEFINITIONS = [
    { id: "vix", label: "VIX (Volatility)", key: "vix", suffix: "", threshold: 20, color: "#ef4444" },
    { id: "yield", label: "Yield Spread", key: "yieldSpread", suffix: "%", threshold: 0, invert: true, color: "#eab308" },
    { id: "pe", label: "S&P 500 P/E", key: "sp500pe", suffix: "", threshold: 25, color: "#3b82f6" },
    { id: "liq", label: "Liquidity", key: "liquidity", suffix: "T", threshold: 5, invert: true, color: "#10b981" },
    { id: "junk", label: "Junk Bond Spread", key: "junkBondSpread", suffix: "bps", threshold: 500, color: "#a855f7" },
    { id: "cfnai", label: "CFNAI (Macro)", key: "cfnai", suffix: "", threshold: -0.7, invert: true, color: "#f97316" },
    { id: "oecd", label: "OECD CLI (Global)", key: "oecdMomentum", suffix: "", threshold: 0, invert: true, color: "#06b6d4" },
];

export default function Dashboard() {
    const [metrics, setMetrics] = useState<MarketMetrics | null>(null);
    const [history, setHistory] = useState<MarketMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [portalLoading, setPortalLoading] = useState(false);
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
                        cfnai: Number(item.cfnai),
                        oecdMomentum: Number(item.oecdMomentum)
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
            {/* Announcement Bar */}
            <div className="bg-yellow-500/10 border-b border-yellow-500/20 py-2 px-4 text-center">
                <p className="text-xs font-medium text-yellow-500 tracking-wide">
                    Worried you might get caught out by the next crash? <span className="text-white opacity-80">Get the morning warning here.</span>
                </p>
            </div>

            {/* Nav */}
            <header className="border-b border-white/5 bg-black/50 backdrop-blur-md p-4 sticky top-0 z-20">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="font-bold text-xl tracking-tighter">
                        CRASHALERT<span className="text-yellow-500">.</span> <span className="text-sm font-normal text-zinc-500 ml-2">Dashboard</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-zinc-400">Welcome, <strong>Expert User</strong></span>
                        <button
                            disabled={portalLoading}
                            onClick={() => {
                                setPortalLoading(true);
                                fetch('/api/portal', { method: 'POST' })
                                    .then(res => res.json())
                                    .then(data => { if (data.url) window.location.href = data.url; else setPortalLoading(false); })
                                    .catch(err => { alert("Failed to load portal"); setPortalLoading(false); });
                            }}
                            className={`text-xs border border-white/10 px-3 py-1.5 rounded hover:bg-white/5 transition mr-2 cursor-pointer ${portalLoading ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            {portalLoading ? 'Redirecting...' : 'Manage Subscription'}
                        </button>
                        <Link href="/" className="text-xs text-zinc-500 hover:text-white transition">Sign Out</Link>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full p-6">

                {/* AI Sentiment Banner */}
                {metrics?.sentiment && (
                    <div className="mb-8 p-4 rounded-xl bg-gradient-to-r from-yellow-500/10 to-transparent border border-yellow-500/20 flex flex-col gap-4">
                        <div className="flex items-start gap-4">
                            <div className="bg-yellow-500/20 p-2 rounded-lg text-yellow-500 text-xl">🤖</div>
                            <div>
                                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-1">AI Market Analyst</h3>
                                <p className="text-zinc-200 text-lg leading-relaxed font-medium">"{metrics.sentiment}"</p>
                            </div>
                        </div>
                        {metrics.rawJson?.newsStats && (
                            <div className="mt-2 pt-4 border-t border-yellow-500/20">
                                <h4 className="text-xs font-mono uppercase text-zinc-500 mb-2">AlphaVantage Global News Sentiment ({metrics.rawJson.newsStats.overallLabel})</h4>
                                <div className="h-[120px] w-full max-w-lg">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart 
                                            data={[
                                                { name: 'Bearish', value: metrics.rawJson.newsStats.counts['Bearish'] || 0, fill: '#ef4444' },
                                                { name: 'Sl. Bear', value: metrics.rawJson.newsStats.counts['Somewhat-Bearish'] || 0, fill: '#f87171' },
                                                { name: 'Neutral', value: metrics.rawJson.newsStats.counts['Neutral'] || 0, fill: '#a1a1aa' },
                                                { name: 'Sl. Bull', value: metrics.rawJson.newsStats.counts['Somewhat-Bullish'] || 0, fill: '#4ade80' },
                                                { name: 'Bullish', value: metrics.rawJson.newsStats.counts['Bullish'] || 0, fill: '#22c55e' }
                                            ]}
                                            margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                                        >
                                            <XAxis dataKey="name" stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <YAxis stroke="#52525b" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                                            <Tooltip cursor={{ fill: '#ffffff10' }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', fontSize: '10px' }} />
                                            <Bar dataKey="value" radius={[2, 2, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Economic Calendar */}
                        {metrics.rawJson?.calendar && (metrics.rawJson.calendar.past.length > 0 || metrics.rawJson.calendar.future.length > 0) && (
                            <div className="mt-8 pt-6 border-t border-yellow-500/20">
                                <h3 className="text-sm font-bold text-yellow-500 uppercase tracking-wider mb-4">Major Economic Calendar</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Past Events */}
                                    <div className="bg-black/20 p-4 rounded-xl border border-yellow-500/10">
                                        <h4 className="text-xs font-mono uppercase text-zinc-500 mb-3">Recent High-Impact Events</h4>
                                        <div className="space-y-4">
                                            {metrics.rawJson.calendar.past.map((ev: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                                                    <div>
                                                        <div className="text-zinc-300 font-medium truncate max-w-[150px]" title={ev.title}>{ev.title} <span className="text-[10px] text-zinc-500 ml-1">{ev.country}</span></div>
                                                        <div className="text-[10px] text-zinc-500">{new Date(ev.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
                                                    </div>
                                                    <div className="text-right text-xs shrink-0">
                                                        <div className="text-zinc-200">Act: <span className="font-mono">{ev.actual ? ev.actual : 'TBD'}</span></div>
                                                        <div className="text-zinc-500">Prev/Fcst: <span className="font-mono">{ev.previous || '-'} / {ev.forecast || '-'}</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                            {metrics.rawJson.calendar.past.length === 0 && <span className="text-xs text-zinc-500">No recent major events.</span>}
                                        </div>
                                    </div>

                                    {/* Future Events */}
                                    <div className="bg-black/20 p-4 rounded-xl border border-yellow-500/10">
                                        <h4 className="text-xs font-mono uppercase text-zinc-500 mb-3">Upcoming High-Impact Events</h4>
                                        <div className="space-y-4">
                                            {metrics.rawJson.calendar.future.map((ev: any, idx: number) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                                                    <div>
                                                        <div className="text-zinc-300 font-medium truncate max-w-[150px]" title={ev.title}>{ev.title} <span className="text-[10px] text-zinc-500 ml-1">{ev.country}</span></div>
                                                        <div className="text-[10px] text-zinc-500">{new Date(ev.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}</div>
                                                    </div>
                                                    <div className="text-right text-xs shrink-0 mt-2">
                                                        <div className="text-zinc-500">Prev/Fcst: <span className="font-mono">{ev.previous || '-'} / {ev.forecast || '-'}</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                            {metrics.rawJson.calendar.future.length === 0 && <span className="text-xs text-zinc-500">No upcoming major events.</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
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
                        const displayVal = metrics ? (def.id === 'oecd' ? val.toFixed(5) : val.toFixed(2)) : '-';
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
                                        {def.id === 'oecd' ? (val > 0 ? 'Positive' : 'Negative') : displayVal}
                                        <span className="text-xs font-normal text-zinc-500 ml-0.5">{def.suffix}</span>
                                    </h3>
                                    {def.id === 'oecd' && metrics && (
                                        <div className="mt-1 flex flex-col gap-0.5">
                                            <div className="text-[9px] uppercase font-bold text-zinc-500">
                                                Trend: <span className={metrics.oecdTrend === 'improving' ? 'text-green-500' : 'text-red-500'}>{metrics.oecdTrend}</span>
                                            </div>
                                            <div className="text-[9px] uppercase font-bold text-zinc-500">
                                                Level: <span className="text-zinc-300">{metrics.oecdValue}</span>
                                            </div>
                                        </div>
                                    )}
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
                        const displayVal = metrics ? (def.id === 'oecd' ? val.toFixed(5) : val.toFixed(2)) : '-';

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
                                        {def.id === 'oecd' && metrics && (
                                            <div className={`mt-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${metrics.oecdTrend === 'improving' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                {metrics.oecdTrend}
                                            </div>
                                        )}
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
