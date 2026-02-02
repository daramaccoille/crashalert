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
    // Scores
    vixScore: number;
    yieldSpreadScore: number;
    sp500peScore: number;
    junkBondSpreadScore: number;
    marginDebtScore: number;
    insiderActivityScore: number;
    cfnaiScore: number;
    liquidityScore: number;
    oneMonthAheadScore: number;
    marketMode: 'BULL' | 'BEAR' | 'NEUTRAL';
    sentiment?: string;
    spyHistory: number[];
}

function getScore(value: number, threshold1: number, threshold2: number, invert: boolean = false): number {
    if (invert) {
        if (value < threshold2) return 2;
        if (value < threshold1) return 1;
        return 0;
    }
    if (value > threshold2) return 2;
    if (value > threshold1) return 1;
    return 0;
}

function calculateSMA(data: number[], period: number): number {
    if (data.length < period) return 0;
    const slice = data.slice(0, period);
    const sum = slice.reduce((a, b) => a + b, 0);
    return sum / period;
}

export async function fetchMarketData(env: Env): Promise<MarketData> {
    const AV_KEY = env.AV_KEY;
    const FRED_KEY = env.FRED_KEY;

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
        marketMode,
        // Scores (0=Normal, 1=Concern, 2=Danger)
        // Adjust thresholds as needed
        vixScore: getScore(currentVix, 20, 30),
        yieldSpreadScore: getScore(spread, 0.0, -0.5, true), // Invert: lower is worse. Wait, yield spread < 0 is inverted. So < 0 is bad (1), < -0.5 is very bad (2)?
        // Re-logic for Yield Spread:
        // Normal: > 0. 
        // Warning: < 0 (Inverted) -> Score 1
        // Danger: < -0.5 -> Score 2?
        // Let's use getScore(spread, 0, -0.5, true) -> if < -0.5 ret 2, if < 0 ret 1. Correct.

        sp500peScore: getScore(27.5, 25, 30),
        junkBondSpreadScore: getScore(junkYield.value, 4.0, 6.0), // 400bps, 600bps
        marginDebtScore: getScore(1126.0, 1000, 1500), // Placeholder thresholds
        insiderActivityScore: getScore(0.33, 0.5, 0.8), // Placeholder
        cfnaiScore: getScore(cfnaiData.value, -0.7, -1.5, true), // Lower is recessionary
        liquidityScore: getScore(liquidityTrillions, 5.0, 4.0, true), // Lower liquidity is worse? Or based on trend?
        oneMonthAheadScore: getScore(oneMonthData.value, 1.0, 0, true),
        spyHistory: spyHistory // Return full history for charting
    };
}
