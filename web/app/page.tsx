import Link from "next/link";
import Ticker from "@/components/Ticker";

export default function Home() {
  const dummyMetrics = [
    { label: "VIX", value: "16.45", risk: "mod" as const },
    { label: "Yield Curve", value: "-0.71", risk: "high" as const },
    { label: "S&P P/E", value: "27.84", risk: "high" as const },
    { label: "Liquidity", value: "$6.58T", risk: "low" as const },
    { label: "Junk Spreads", value: "271 bps", risk: "low" as const },
  ];

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

        <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-12 leading-relaxed font-light">
          Institutional-grade risk intelligence for the retail trader.
          We monitor <span className="text-gray-200 font-medium">Yield Curves</span>, <span className="text-gray-200 font-medium">Liquidity</span>, and <span className="text-gray-200 font-medium">Volatility</span> 24/7.
        </p>

        <form className="w-full max-w-md flex flex-col sm:flex-row gap-3 relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl opacity-20 group-hover:opacity-40 blur transition duration-500"></div>
          <input
            type="email"
            placeholder="Enter your email for early signals..."
            className="relative flex-1 bg-black/60 backdrop-blur-xl border border-white/10 rounded-lg px-6 py-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-white/30 transition shadow-inner"
          />
          <button className="relative bg-white text-black font-bold px-8 py-4 rounded-lg hover:bg-gray-100 transition shadow-[0_0_20px_rgba(255,255,255,0.2)]">
            Get Alerts
          </button>
        </form>

        <div className="mt-8 flex items-center gap-4 text-xs text-gray-500 font-mono">
          <span className="flex items-center gap-1">
            <span className="text-green-500">●</span> 98% Uptime
          </span>
          <span className="hidden sm:inline">|</span>
          <span>Monitoring $50M+ Assets</span>
        </div>
      </section>

      {/* Live Ticker (Glass) */}
      <div className="w-full z-10 border-y border-white/5 bg-black/30 backdrop-blur-sm">
        <Ticker metrics={dummyMetrics} />
      </div>

      {/* Features Grid */}
      <section id="features" className="w-full max-w-7xl px-6 py-32 grid md:grid-cols-3 gap-8 z-10">
        {[
          { title: "Smart Money Flows", desc: "Track Central Bank liquidity extraction before it hits the stock market.", icon: "💸", grad: "from-green-500/20 to-emerald-500/0" },
          { title: "Insiders vs. Retail", desc: "See when CEOs are selling while retail investors are buying.", icon: "👥", grad: "from-blue-500/20 to-indigo-500/0" },
          { title: "AI Predictions", desc: "Next-day VIX and SPX volatility forecasts powered by Gemini.", icon: "🤖", grad: "from-purple-500/20 to-fuchsia-500/0" },
        ].map((f, i) => (
          <div key={i} className="group relative glass-panel p-1 rounded-3xl transition-transform hover:-translate-y-1 duration-500">
            {/* Hover Gradient Border */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition duration-500"></div>

            <div className="relative h-full bg-[#0A0A0A]/80 backdrop-blur-xl rounded-[22px] p-8 border border-white/5 overflow-hidden">
              {/* Inner Glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${f.grad} blur-2xl rounded-full -mr-10 -mt-10`}></div>

              <div className="text-5xl mb-6 filter drop-shadow-lg">{f.icon}</div>
              <h3 className="text-2xl font-bold text-white mb-3">{f.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm font-light">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section id="pricing" className="w-full max-w-7xl px-6 pb-32 z-10 flex flex-col items-center">
        <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Choose Your Radar</h2>
        <p className="text-gray-400 mb-16 text-center max-w-lg">Simple pricing. No hidden fees. Cancel anytime.</p>

        <div className="grid md:grid-cols-3 gap-6 w-full items-end">
          {/* Basic */}
          <div className="glass-panel p-8 rounded-3xl border-white/5 bg-white/[0.02] flex flex-col h-min hover:bg-white/[0.04] transition">
            <h3 className="text-lg font-medium text-gray-300">Basic</h3>
            <div className="text-4xl font-bold text-white mt-4 mb-2">$9<span className="text-sm font-normal text-gray-500">/mo</span></div>
            <p className="text-xs text-gray-500 mb-8">For casual observers.</p>

            <ul className="space-y-4 mb-8 text-sm text-gray-400">
              <li className="flex gap-3"><span className="text-white">✓</span> Daily Risk Check</li>
              <li className="flex gap-3"><span className="text-white">✓</span> "Positions Check" Email</li>
              <li className="flex gap-3 opacity-40">✕ Deep Dive Metrics</li>
            </ul>
            <button className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 transition text-white text-sm font-medium">Start Basic</button>
          </div>

          {/* Pro */}
          <div className="relative p-[1px] rounded-3xl bg-gradient-to-b from-indigo-500 to-indigo-900 shadow-[0_0_40px_rgba(99,102,241,0.3)] transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-500 text-white text-[10px] uppercase font-bold px-3 py-1 rounded-full tracking-wider shadow-lg">Most Popular</div>

            <div className="bg-[#0b0c15] rounded-[23px] p-8 h-full">
              <h3 className="text-lg font-medium text-indigo-300">Pro</h3>
              <div className="text-4xl font-bold text-white mt-4 mb-2">$29<span className="text-sm font-normal text-gray-500">/mo</span></div>
              <p className="text-xs text-gray-500 mb-8">For active traders.</p>

              <ul className="space-y-4 mb-8 text-sm text-gray-300">
                <li className="flex gap-3"><span className="text-indigo-400">✓</span> Everything in Basic</li>
                <li className="flex gap-3"><span className="text-indigo-400">✓</span> Full Metric Dashboard</li>
                <li className="flex gap-3"><span className="text-indigo-400">✓</span> AI Market Summary</li>
                <li className="flex gap-3"><span className="text-indigo-400">✓</span> Early Warning Signals</li>
              </ul>
              <button className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-white font-bold text-sm shadow-lg shadow-indigo-500/25">Get Pro</button>
            </div>
          </div>

          {/* Advanced */}
          <div className="glass-panel p-8 rounded-3xl border-white/5 bg-white/[0.02] flex flex-col h-min hover:bg-white/[0.04] transition">
            <h3 className="text-lg font-medium text-gray-300">Advanced</h3>
            <div className="text-4xl font-bold text-white mt-4 mb-2">$99<span className="text-sm font-normal text-gray-500">/mo</span></div>
            <p className="text-xs text-gray-500 mb-8">For serious investors.</p>

            <ul className="space-y-4 mb-8 text-sm text-gray-400">
              <li className="flex gap-3"><span className="text-white">✓</span> Custom Alert Builder</li>
              <li className="flex gap-3"><span className="text-white">✓</span> Predictive Trend Charts</li>
              <li className="flex gap-3"><span className="text-white">✓</span> Priority Support</li>
            </ul>
            <button className="w-full py-3 rounded-xl border border-white/10 hover:bg-white/5 transition text-white text-sm font-medium">Contact Sales</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 py-12 text-center text-gray-600 text-sm bg-black/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center px-6">
          <p>© 2026 CrashAlert Inc.</p>
          <div className="flex gap-8 mt-4 md:mt-0">
            <Link href="#" className="hover:text-white transition">Terms</Link>
            <Link href="#" className="hover:text-white transition">Privacy</Link>
            <Link href="#" className="hover:text-white transition">Twitter</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
