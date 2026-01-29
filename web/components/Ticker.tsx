import React from 'react';

interface TickerProps {
    metrics: { label: string; value: string; risk: 'low' | 'mod' | 'high' }[];
}

export default function Ticker({ metrics }: TickerProps) {
    return (
        <div className="w-full overflow-hidden bg-black/20 border-y border-white/5 py-3">
            <div className="flex animate-scroll whitespace-nowrap w-[200%]">
                {[...metrics, ...metrics, ...metrics].map((m, i) => (
                    <div key={i} className="mx-6 flex items-center space-x-2 text-sm font-mono">
                        <span className="text-gray-400">{m.label}:</span>
                        <span className={m.risk === 'high' ? 'text-risk-high animate-pulse' : m.risk === 'mod' ? 'text-risk-mod' : 'text-risk-low'}>
                            {m.value}
                        </span>
                        <span className={`w-2 h-2 rounded-full ${m.risk === 'high' ? 'bg-risk-high' : m.risk === 'mod' ? 'bg-risk-mod' : 'bg-risk-low'
                            }`}></span>
                    </div>
                ))}
            </div>
        </div>
    );
}
