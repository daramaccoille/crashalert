import React from 'react';

interface TickerProps {
    metrics: { label: string; value: string; risk: 'low' | 'mod' | 'high' }[];
}

export default function Ticker({ metrics }: TickerProps) {
    return (
        <div className="w-full overflow-hidden bg-black/20 border-y border-white/5 py-3">
            <div className="flex animate-scroll whitespace-nowrap w-[200%] gap-16 px-4">
                {[...metrics, ...metrics, ...metrics, ...metrics].map((m, i) => (
                    <div key={i} className="flex items-center space-x-3 text-sm font-mono tracking-wider">
                        <span className="text-zinc-500 font-semibold">{m.label}</span>
                        <span className={`font-bold ${m.risk === 'high' ? 'text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]' : m.risk === 'mod' ? 'text-amber-500' : 'text-emerald-500'}`}>
                            {m.value}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
