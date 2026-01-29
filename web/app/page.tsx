"use client";

import Link from "next/link";
import Ticker from "@/components/Ticker";
import { useEffect, useState } from "react";

export default function Home() {
  const [metrics, setMetrics] = useState<{ label: string; value: string; risk: 'low' | 'mod' | 'high' }[]>([
    { label: "VIX", value: "Loading...", risk: "low" },
    { label: "Yield", value: "Loading...", risk: "low" },
    { label: "P/E", value: "Loading...", risk: "low" },
    { label: "Liquidity", value: "Loading...", risk: "low" },
    { label: "Junk Sprd", value: "Loading...", risk: "low" },
  ]);

  useEffect(() => {
    async function fetchMetrics() {
      try {
        const res = await fetch('/api/metrics');
        if (res.ok) {
          const data = await res.json();

          setMetrics([
            { label: "VIX", value: data.vix, risk: Number(data.vix) > 20 ? "high" : "low" },
            { label: "Yield", value: data.yieldSpread, risk: Number(data.yieldSpread) < 0 ? "high" : "low" },
            { label: "S&P P/E", value: data.sp500pe, risk: Number(data.sp500pe) > 25 ? "high" : "mod" },
            { label: "Liquidity", value: `$${data.liquidity}T`, risk: "low" },
            { label: "Junk Sprd", value: `${data.junkBondSpread}bps`, risk: Number(data.junkBondSpread) > 400 ? "high" : "low" },
          ]);
        }
      } catch (e) {
        console.error("Failed to fetch metrics", e);
      }
    }
    fetchMetrics();
  }, []);

  return (
    <main className="min-h-screen relative flex flex-col items-center overflow-hidden bg-[#050505] text-white selection:bg-yellow-500/30">

      {/* Background Radiance */}
      <div className="fixed top-0 left-0 w-full h-[500px] bg-gradient-to-b from-yellow-900/10 to-transparent pointer-events-none"></div>

      {/* Nav */}
      <header className="w-full max-w-7xl z-20 p-6 flex justify-between items-center text-sm font-medium tracking-wide border-b border-white/5 bg-black/50 backdrop-blur-md sticky top-0">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tighter text-white">
          CRASHALERT<span className="text-yellow-500">.</span>
        </div>
        <nav className="sm:flex gap-6 text-gray-400 hidden">
          <Link href="#pricing" className="hover:text-yellow-400 transition-colors duration-300">Pricing</Link>
          <Link href="/login" className="hover:text-white transition-colors">Login</Link>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 w-full flex flex-col items-center justify-center pt-24 pb-20 px-4 text-center max-w-4xl mx-auto">

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
          Daily AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600">Market Signals.</span>
        </h1>

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-4 leading-relaxed font-light">
          The 2-minute daily read for informed trading.
        </p>

        <p className="text-yellow-500 font-medium mb-12 tracking-widest text-sm uppercase">
          VIX • YIELD • LIQUIDITY • SPX
        </p>

        {/* Input Form */}
        <form className="w-full max-w-md flex flex-col gap-4 relative">
          <input
            type="email"
            placeholder="email@example.com"
            className="w-full bg-white/5 border border-white/20 rounded-lg px-6 py-4 text-white placeholder:text-zinc-600 focus:outline-none focus:border-yellow-500/50 transition focus:ring-1 focus:ring-yellow-500/20 backdrop-blur-sm"
          />
          <p className="text-xs text-zinc-500 text-right w-full -mt-2">Enter your email to subscribe.</p>
          <button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold px-8 py-4 rounded-lg transition shadow-[0_0_25px_rgba(234,179,8,0.3)] border border-yellow-400/20">
            Subscribe
          </button>
        </form>

      </section>

      {/* Ticker - Styled minimal */}
      <div className="w-full z-10 border-y border-white/5 bg-black/40 backdrop-blur-sm py-2">
        <Ticker metrics={metrics} />
      </div>

      {/* Pricing / Features Cards */}
      <section id="pricing" className="w-full max-w-6xl px-6 py-24 z-10">
        <div className="grid md:grid-cols-2 gap-8 items-start">

          {/* Basic Card */}
          <div className="glass-panel p-1 rounded-2xl bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition duration-300">
            <div className="bg-[#0c0c0c] rounded-xl p-8 h-full flex flex-col">
              <div className="mb-6">
                <div className="text-2xl font-bold text-white mb-2">Basic</div>
                <div className="text-4xl font-bold text-yellow-500">$9 <span className="text-sm text-gray-500 font-normal">/ month</span></div>
              </div>

              <div className="w-full h-32 bg-zinc-900 rounded-lg mb-6 border border-zinc-800 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/5"></div>
                <span className="text-zinc-700 text-sm font-mono">Market Snapshot Preview</span>
                {/* Abstract chart line */}
                <svg className="absolute bottom-0 left-0 right-0 h-16 w-full text-zinc-700 opacity-50" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0 20 L0 15 L20 18 L40 10 L60 14 L80 5 L100 12 L100 20 Z" fill="currentColor" />
                </svg>
              </div>

              <ul className="space-y-4 mb-8 text-zinc-400 text-sm flex-1">
                <li className="flex gap-3 items-center"><span className="text-yellow-500">✓</span> Daily Risk Check</li>
                <li className="flex gap-3 items-center"><span className="text-yellow-500">✓</span> Weekly Digest</li>
                <li className="flex gap-3 items-center"><span className="text-yellow-500">✓</span> Brief Predictions</li>
              </ul>

              <button className="w-full py-3 rounded-lg border border-zinc-700 hover:bg-zinc-800 transition text-white font-medium">Select Basic</button>
            </div>
          </div>

          {/* Pro Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-b from-yellow-500 to-yellow-700 rounded-2xl opacity-75 blur-sm group-hover:opacity-100 transition duration-500"></div>
            <div className="absolute top-0 right-0 bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg z-20">RECOMMENDED</div>

            <div className="relative bg-[#0c0c0c] rounded-2xl p-8 h-full flex flex-col border border-yellow-500/20">
              <div className="mb-6 relative z-10">
                <div className="text-2xl font-bold text-white mb-2 pr-28">Pro Analyst</div>
                <div className="text-4xl font-bold text-yellow-400">$29 <span className="text-sm text-zinc-500 font-normal">/ month</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-6">
                <div className="h-16 bg-zinc-800/50 rounded border border-zinc-700/50 flex items-center justify-center p-2">
                  <div className="w-full h-full bg-zinc-900 rounded relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-full h-1/2 bg-yellow-500/10"></div>
                    <div className="absolute bottom-2 left-2 w-4 h-8 bg-yellow-500/50 rounded-sm"></div>
                    <div className="absolute bottom-2 left-8 w-4 h-5 bg-zinc-700 rounded-sm"></div>
                  </div>
                </div>
                <div className="h-16 bg-zinc-800/50 rounded border border-zinc-700/50 flex items-center justify-center p-2">
                  <div className="text-[10px] text-zinc-400 text-center leading-tight">AI Analysis &<br />Top Picks</div>
                </div>
              </div>

              <ul className="space-y-4 mb-8 text-gray-300 text-sm flex-1">
                <li className="flex gap-3 items-center"><span className="text-yellow-400">✓</span> All Market Symbols</li>
                <li className="flex gap-3 items-center"><span className="text-yellow-400">✓</span> Best Daily Predictions</li>
                <li className="flex gap-3 items-center"><span className="text-yellow-400">✓</span> Deep Learning "Buy/Sell" Signals</li>
                <li className="flex gap-3 items-center"><span className="text-yellow-400">✓</span> Priority Alerts</li>
              </ul>

              <button className="w-full py-3 rounded-lg bg-yellow-500 hover:bg-yellow-400 transition text-black font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]">Select Pro</button>
            </div>
          </div>

        </div>
      </section>

      {/* Simple Footer */}
      <footer className="w-full border-t border-white/5 py-12 text-center text-zinc-700 text-sm">
        <p>© 2026 CrashAlert Inc.</p>
      </footer>
    </main>
  );
}
