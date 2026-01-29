"use client";

import React, { useState } from 'react';
import TrendChartPreview from '@/components/TrendChartPreview';

const AVAILABLE_ALERTS = [
    { id: 'vix', label: 'VIX Volatility', desc: 'Measures market fear. >20 is elevated risk.' },
    { id: 'yield_spread', label: 'Yield Curve (10y-2y)', desc: 'Inversion signals recession risk.' },
    { id: 'sp500_pe', label: 'S&P 500 P/E', desc: 'Valuation metric. >25 is expensive.' },
    { id: 'junk_spread', label: 'Junk Bond Spread', desc: 'Credit market stress indicator.' },
    { id: 'margin_debt', label: 'Margin Debt', desc: 'Measures investor leverage/greed.' },
    { id: 'insider', label: 'Insider Buy/Sell', desc: 'Ratio of executive buying vs selling.' },
    { id: 'cfnai', label: 'Chicago Fed Index', desc: 'Economic activity indicator.' },
    { id: 'liquidity', label: 'Fed Liquidity', desc: 'Total Central Bank assets trend.' },
    { id: 'sentiment', label: 'Consumer Sentiment', desc: '1-month ahead consumer outlook.' },
    { id: 'market_mode', label: 'Market Mode', desc: 'Bull/Bear technical trend status.' },
];

export default function EnterpriseAlerts() {
    const [selected, setSelected] = useState<string[]>([]);
    const [hovered, setHovered] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [saving, setSaving] = useState(false);

    const toggleAlert = (id: string) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(s => s !== id));
        } else {
            if (selected.length >= 8) return; // Max 8 limit
            setSelected([...selected, id]);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await fetch('/api/user/alerts', {
                method: 'POST',
                body: JSON.stringify({ email, alerts: selected }),
            });
            alert("Preferences Saved!");
        } catch (e) {
            alert("Failed to save.");
        }
        setSaving(false);
    };

    const activePreviewId = hovered || selected[selected.length - 1] || 'vix';
    const activeAlert = AVAILABLE_ALERTS.find(a => a.id === activePreviewId);

    return (
        <div className="min-h-screen bg-black text-white p-8 font-sans">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">

                {/* Left Column: Controls */}
                <div className="flex-1">
                    <header className="mb-8 border-b border-white/10 pb-6">
                        <h1 className="text-3xl font-bold mb-2">Enterprise Alert Configuration</h1>
                        <p className="text-gray-400 text-sm">Select up to 8 custom indicators for your daily intelligence briefing.</p>
                    </header>

                    {/* Auth Simulation */}
                    <div className="mb-6 p-4 bg-blue-900/10 border border-blue-500/20 rounded-lg">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="simulated user email..."
                            className="bg-transparent border-b border-blue-500/50 w-full text-white focus:outline-none text-sm py-1"
                        />
                    </div>

                    <div className="grid md:grid-cols-2 gap-3 mb-12">
                        {AVAILABLE_ALERTS.map((alert) => {
                            const isSelected = selected.includes(alert.id);
                            const isDisabled = !isSelected && selected.length >= 8;

                            return (
                                <div
                                    key={alert.id}
                                    onClick={() => !isDisabled && toggleAlert(alert.id)}
                                    onMouseEnter={() => setHovered(alert.id)}
                                    onMouseLeave={() => setHovered(null)}
                                    className={`
                    relative p-4 rounded-lg border transition-all cursor-pointer group
                    ${isSelected
                                            ? 'bg-indigo-600/20 border-indigo-500'
                                            : isDisabled
                                                ? 'opacity-30 cursor-not-allowed border-white/5'
                                                : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                                        }
                    `}
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className={`font-bold text-sm mb-1 ${isSelected ? 'text-indigo-400' : 'text-white'}`}>
                                                {alert.label}
                                            </h3>
                                            <p className="text-xs text-gray-500">{alert.desc}</p>
                                        </div>
                                        {isSelected && <span className="text-green-400 text-xs">●</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column: Preview Panel (Sticky) */}
                <div className="w-full md:w-80 flex flex-col gap-6">
                    <div className="sticky top-8">
                        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Live Email Preview</h2>

                            {activeAlert && (
                                <div className="animate-pulse-slow">
                                    <div className="text-xl font-bold text-white mb-1">{activeAlert.label}</div>
                                    <div className="text-sm text-gray-400 mb-4">{activeAlert.desc}</div>

                                    <TrendChartPreview
                                        label={`${activeAlert.label} Trend`}
                                        color={['vix', 'yield_spread', 'junk_spread'].includes(activeAlert.id) ? '#EF4444' : '#10B981'}
                                    />

                                    <div className="mt-4 p-3 bg-white/5 rounded text-xs text-gray-300 italic border-l-2 border-indigo-500">
                                        "AI predicts a 15% deviation from normal boundaries tomorrow due to rising bond yields."
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-8">
                            <div className="text-gray-400 text-center mb-4 text-sm">
                                <span className={`font-bold ${selected.length === 8 ? 'text-red-400' : 'text-white'}`}>
                                    {selected.length}
                                </span> / 8 Alerts Selected
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition disabled:opacity-50 shadow-lg shadow-indigo-500/30"
                            >
                                {saving ? 'Saving...' : 'Activate Intelligence'}
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
