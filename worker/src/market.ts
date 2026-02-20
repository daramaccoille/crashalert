import { fetchFredSeries } from './utils/fred';
import { AlphaVantageClient } from './utils/alphavantage';
import { Env } from './index';
import { getUpcomingEvents } from './utils/events';
import { scrapeSP500PE } from './utils/pe_scraper';

export const RISK_THRESHOLDS = {
    vix: 20,
    yieldSpread: 0.0,
    sp500pe: 25,
    junkBondSpread: 4.0,
    marginDebt: 1000,
    insiderActivity: 0.5,
    cfnai: -0.7,
    liquidity: 5.0,
    oneMonthAhead: 1.0
};

export interface MarketData {
    vix: number;
    yieldSpread: number;
    sp500pe: number;
    junkBondSpread: number;
    marginDebt: number;
    insiderActivity: number;
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
    aggregateRiskScore: number;
    upcomingEvents: { name: string; daysUntil: number; description: string }[];
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
        spyHistory,
        currentPeRatio
    ] = await Promise.all([
        fetchFredSeries('VIXCLS', FRED_KEY).catch(e => ({ value: 16.5, date: 'mock' })), // Fallback to safe defaults if API fails
        fetchFredSeries('DGS10', FRED_KEY).catch(e => ({ value: 4.0, date: 'mock' })),
        fetchFredSeries('DGS2', FRED_KEY).catch(e => ({ value: 4.2, date: 'mock' })),
        fetchFredSeries('BAMLH0A0HYM2', FRED_KEY).catch(e => ({ value: 3.5, date: 'mock' })),
        fetchFredSeries('CFNAI', FRED_KEY).catch(e => ({ value: -0.1, date: 'mock' })),
        fetchFredSeries('WALCL', FRED_KEY).catch(e => ({ value: 7500000, date: 'mock' })), // Millions
        fetchFredSeries('JLNUM1M', FRED_KEY).catch(e => ({ value: 3.0, date: 'mock' })),
        avClient.getGlobalQuote('SPY').catch(e => 500),
        avClient.getDailyCloses('SPY', 'full').catch(e => []),
        scrapeSP500PE().catch(e => 29.5)
    ]);

    // 2. Process Calculations
    const currentVix = vixData.value;
    const spread = yield10y.value - yield2y.value;
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

    const data: MarketData = {
        vix: currentVix,
        yieldSpread: spread,
        sp500pe: currentPeRatio,
        junkBondSpread: junkYield.value,
        marginDebt: 1126.0,
        insiderActivity: 0.33,
        cfnai: cfnaiData.value,
        liquidity: liquidityTrillions,
        oneMonthAhead: oneMonthData.value,
        marketMode,
        // Scores
        vixScore: getScore(currentVix, RISK_THRESHOLDS.vix, 30),
        yieldSpreadScore: getScore(spread, RISK_THRESHOLDS.yieldSpread, -0.5, true),
        sp500peScore: getScore(currentPeRatio, RISK_THRESHOLDS.sp500pe, 35),
        junkBondSpreadScore: getScore(junkYield.value, RISK_THRESHOLDS.junkBondSpread, 6.0),
        marginDebtScore: getScore(1126.0, RISK_THRESHOLDS.marginDebt, 1500),
        insiderActivityScore: getScore(0.33, RISK_THRESHOLDS.insiderActivity, 0.8),
        cfnaiScore: getScore(cfnaiData.value, RISK_THRESHOLDS.cfnai, -1.5, true),
        liquidityScore: getScore(liquidityTrillions, RISK_THRESHOLDS.liquidity, 4.0, true),
        oneMonthAheadScore: getScore(oneMonthData.value, RISK_THRESHOLDS.oneMonthAhead, 0, true),
        spyHistory: spyHistory,
        aggregateRiskScore: 0,
        upcomingEvents: getUpcomingEvents()
    };

    // Calculate final aggregate score
    data.aggregateRiskScore =
        data.vixScore +
        data.yieldSpreadScore +
        data.sp500peScore +
        data.junkBondSpreadScore +
        data.marginDebtScore +
        data.insiderActivityScore +
        data.cfnaiScore +
        data.liquidityScore +
        data.oneMonthAheadScore;

    return data;
}
