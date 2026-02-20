
export interface MarketEvent {
    name: string;
    daysUntil: number;
    description: string;
}

export function getUpcomingEvents(): MarketEvent[] {
    const now = new Date();
    const dayOfWeek = now.getUTCDay(); // 0 = Sun, 1 = Mon...
    const dateOfMonth = now.getUTCDate();

    const events: MarketEvent[] = [];

    // 1. Fed Balance Sheet (Usually Thursday around 4:30 PM ET)
    // Modeled as a weekly cycle
    let daysUntilFed = (4 - dayOfWeek + 7) % 7;
    if (daysUntilFed === 0 && now.getUTCHours() > 20) daysUntilFed = 7;
    events.push({
        name: "Liquidity Update",
        daysUntil: daysUntilFed,
        description: "Federal Reserve Balance Sheet (WALCL) update."
    });

    // 2. CFNAI Release (Usually around the 20th-25th of the month)
    // Simple logic for illustration
    let daysUntilCFNAI = 22 - dateOfMonth;
    if (daysUntilCFNAI < 0) daysUntilCFNAI += 30; // Approx next month
    events.push({
        name: "Economic Activity",
        daysUntil: daysUntilCFNAI,
        description: "CFNAI Macro Index monthly release."
    });

    // 3. S&P 500 P/E Calculation
    // We can mock this as a 2-day warning as requested for the example
    events.push({
        name: "Valuation Check",
        daysUntil: 2,
        description: "Quarterly earnings cycle adjustment."
    });

    return events.sort((a, b) => a.daysUntil - b.daysUntil);
}
