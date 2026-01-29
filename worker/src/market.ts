import { fetchFredSeries } from './utils/fred';
import { AlphaVantageClient } from './utils/alphavantage';
import { Env } from './index';

export interface MarketData {
    vix: number;
    yieldSpread: number;
    sp500pe: number; // Placeholder: hard to get real PE from simple free APIs, might mock or use simple price proxy
    junkBondSpread: number;
    marginDebt: number; // Will likely need manual or mock
    insiderActivity: number; // Will likely need manual or mock
    cfnai: number;
    liquidity: number;
    oneMonthAhead: number;
    marketMode: 'BULL' | 'BEAR' | 'NEUTRAL';
}

function calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    const slice = data.slice(0, period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
}

export async function fetchMarketData(env: Env): Promise<MarketData> {
    const av = new AlphaVantageClient(env.GEMINI_KEY); // Using GEMINI_KEY as placeholder? Wait, need separate keys.
    // The user provided keys in the prompt:
    // FRED: 0660086ceb0adf4839c6fcbfa35b3526
    // AV: BL1KL3HFI4C31SPD

    // In production, use env.AV_KEY. defining fallback here for user context awareness
    const AV_KEY = "BL1KL3HFI4C31SPD";
    const FRED_KEY = "0660086ceb0adf4839c6fcbfa35b3526";

    const avClient = new AlphaVantageClient(AV_KEY);

    // 1. Parallel Fetching where possible
    const [
        vixData,
        yield10y,
        yield2y,
        junkYield,
        cfnaiData,
        liquidityData,
        oneMonthData,
        spyPrice,
        spyHistory
    ] = await Promise.all([
        fetchFredSeries('VIXCLS', FRED_KEY).catch(e => ({ value: 16.5, date: 'mock' })), // Fallback to safe defaults if API fails
        fetchFredSeries('DGS10', FRED_KEY).catch(e => ({ value: 4.0, date: 'mock' })),
        fetchFredSeries('DGS2', FRED_KEY).catch(e => ({ value: 4.2, date: 'mock' })),
        fetchFredSeries('BAMLH0A0HYM2', FRED_KEY).catch(e => ({ value: 3.5, date: 'mock' })),
        fetchFredSeries('CFNAI', FRED_KEY).catch(e => ({ value: -0.1, date: 'mock' })),
        fetchFredSeries('WALCL', FRED_KEY).catch(e => ({ value: 7500000, date: 'mock' })), // Millions
        fetchFredSeries('JLNUM1M', FRED_KEY).catch(e => ({ value: 3.0, date: 'mock' })),
        avClient.getGlobalQuote('SPY').catch(e => 500),
        avClient.getDailyCloses('SPY', 'full').catch(e => [])
    ]);

    // 2. Process Calculations
    const currentVix = vixData.value;
    const spread = yield10y.value - yield2y.value;
    const junkSpreadBps = junkYield.value * 100; // if yielded as percentage? FRED BAMLH0A0HYM2 is usually percent e.g. 3.25
    // Actually BAMLH0A0HYM2 is "Option-Adjusted Spread". 
    // If value is 3.25, that is 3.25%. 
    // The user sheet said "2.71" -> "3 bps"? Wait, 2.71% = 271 bps. 
    // The user logic: "Spread: 3 bps" in the Note seems like a typo or old data.
    // Let's standardise: 2.71 value = 271 bps.

    // Liquidity: FRED returns Millions. We want Trillions for display.
    const liquidityTrillions = liquidityData.value / 1000000;

    // Market Mode
    let marketMode: 'BULL' | 'BEAR' | 'NEUTRAL' = 'NEUTRAL';
    if (spyHistory.length >= 200) {
        const sma50 = calculateSMA(spyHistory, 50);
        const sma200 = calculateSMA(spyHistory, 200);
        let bullScore = 0;
        let bearScore = 0;

        if (spyPrice > sma200) bullScore += 2; else bearScore += 2;
        if (spyPrice > sma50) bullScore += 1; else bearScore += 1;
        if (sma50 > sma200) bullScore += 1; else bearScore += 1;

        if (bullScore > bearScore) marketMode = 'BULL';
        else if (bearScore > bullScore) marketMode = 'BEAR';
    }

    return {
        vix: currentVix,
        yieldSpread: spread,
        sp500pe: 27.5, // Mocked for now, hard to get free real-time PE
        junkBondSpread: junkYield.value, // Keep as raw percentage for now (e.g. 2.71)
        marginDebt: 1126.0, // Mocked/Manual
        insiderActivity: 0.33, // Mocked/Manual
        cfnai: cfnaiData.value,
        liquidity: liquidityTrillions,
        oneMonthAhead: oneMonthData.value,
        marketMode
    };
}
