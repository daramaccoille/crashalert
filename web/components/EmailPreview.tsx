import React from 'react';

// Hardcoded for preview purposes on the frontend
interface EmailPreviewProps {
    plan?: 'basic' | 'pro' | 'expert';
}

const styles = {
    clean: { fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", lineHeight: "1.6", color: "#333", backgroundColor: "#f9f9f9", padding: "10px", borderRadius: "8px", fontSize: "12px", border: "1px solid #ddd" },
    header: { backgroundColor: "#000", color: "#D4AF37", padding: "10px", textAlign: "center" as const, borderRadius: "5px 5px 0 0" },
    card: { backgroundColor: "#fff", padding: "10px", borderRadius: "5px", marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" },
    row: { display: "flex", justifyContent: "space-between", borderBottom: "1px solid #eee", padding: "4px 0" },
    scoreNorm: { color: "#4CAF50", fontWeight: "bold" as const },
    scoreWarn: { color: "#FF9800", fontWeight: "bold" as const },
    scoreDang: { color: "#F44336", fontWeight: "bold" as const },
    aiBox: { backgroundColor: "#FFF8E1", padding: "8px", borderLeft: "3px solid #D4AF37", marginBottom: "10px", fontSize: "11px" }
};

export default function EmailPreview({ plan = 'basic' }: EmailPreviewProps) {

    // Mock Data
    const mockData = {
        vix: "16.45", vixScore: 0,
        yieldSpread: "-0.40", yieldScore: 1, // Warning
        liq: "7.2T", liqScore: 1,
        pe: "27.5", peScore: 0,
        sentiment: "Volatility remains low but liquidity contraction signals caution."
    };

    const Header = ({ title }: { title: string }) => (
        <div style={styles.header}>
            <h1 style={{ margin: 0, fontSize: "14px" }}>CRASH ALERT</h1>
            <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#fff" }}>{title}</p>
        </div>
    );

    const Metric = ({ label, value, score }: { label: string, value: string, score: number }) => (
        <div style={styles.row}>
            <span>{label}</span>
            <span style={score === 0 ? styles.scoreNorm : score === 1 ? styles.scoreWarn : styles.scoreDang}>{value}</span>
        </div>
    );

    const AI = ({ blur = false }) => (
        <div style={styles.aiBox}>
            <strong style={{ color: "#D4AF37" }}>🤖 AI Insight:</strong>
            {blur ? (
                <span className="blur-[3px] opacity-70 ml-1">Market conditions suggest significantly increased...</span>
            ) : (
                <span className="italic ml-1">"{mockData.sentiment}"</span>
            )}
        </div>
    );

    return (
        <div className="w-full max-w-[300px] overflow-hidden rounded-lg shadow-lg text-[10px] sm:text-xs">
            <div style={styles.clean}>

                {plan === 'basic' && (
                    <>
                        <Header title="Basic Market Update" />
                        <div style={styles.card}>
                            <h2 className="text-center font-bold text-green-600 mb-2">Mode: NEUTRAL</h2>
                            <Metric label="VIX" value={mockData.vix} score={0} />
                            <Metric label="Yield 10y-2y" value={mockData.yieldSpread} score={1} />
                            <Metric label="Liquidity" value={`$${mockData.liq}`} score={1} />
                            <div className="mt-2 p-2 bg-gray-100 rounded text-center text-gray-500 text-[10px]">
                                <strong>AI Insight:</strong> <span className="blur-sm">Blurred for Basic...</span>
                            </div>
                        </div>
                        <div className="text-center text-gray-400 text-[9px] mt-2">© CrashAlert</div>
                    </>
                )}

                {plan === 'pro' && (
                    <>
                        <Header title="Pro Risk Report" />
                        <div style={styles.card}>
                            <h2 className="text-center font-bold text-green-600 mb-2">Mode: NEUTRAL</h2>
                            <AI />
                            <Metric label="VIX" value={mockData.vix} score={0} />
                            <Metric label="Yield Spread" value={mockData.yieldSpread} score={1} />
                            <Metric label="S&P 500 P/E" value={mockData.pe} score={0} />
                            <Metric label="Liquidity" value={`$${mockData.liq}`} score={1} />
                            <div className="text-center text-gray-400 text-[9px] mt-1">+ 5 More Metrics</div>
                        </div>
                    </>
                )}

                {plan === 'expert' && (
                    <>
                        <Header title="Expert Intelligence" />
                        <div style={styles.card}>
                            <h2 className="text-center font-bold text-green-600 mb-2">Mode: NEUTRAL</h2>
                            <div className="mb-2 border border-gray-200 rounded h-16 bg-white flex items-center justify-center text-gray-400 text-[9px]">
                                [Trend Chart Visualization]
                            </div>
                            <AI />
                            <div className="space-y-1">
                                <Metric label="VIX" value={mockData.vix} score={0} />
                                <Metric label="Yield Spread" value={mockData.yieldSpread} score={1} />
                                <Metric label="S&P 500 P/E" value={mockData.pe} score={0} />
                                <Metric label="Liquidity" value={`$${mockData.liq}`} score={1} />
                            </div>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
}
