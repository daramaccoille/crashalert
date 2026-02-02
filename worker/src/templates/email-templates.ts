
import { MarketData } from '../market';

// Common styles for consistency
const cleanStyle = `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
`;

const headerStyle = `
  background-color: #000;
  color: #D4AF37; /* Gold */
  padding: 20px;
  text-align: center;
  border-radius: 5px 5px 0 0;
`;

const cardStyle = `
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  margin-bottom: 20px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
`;

const footerStyle = `
  text-align: center;
  font-size: 12px;
  color: #888;
  margin-top: 20px;
`;

function getModeColor(mode: string) {
  if (mode === 'BULL') return '#4CAF50'; // Green
  if (mode === 'BEAR') return '#F44336'; // Red
  return '#FFC107'; // Amber/Neutral
}

function getScoreColor(score: number) {
  if (score === 0) return '#4CAF50';
  if (score === 1) return '#FF9800';
  return '#F44336';
}

function generateCommonHeader(title: string) {
  return `
      <div style="${headerStyle}">
        <h1 style="margin:0; font-size: 24px;">CRASH ALERT</h1>
        <p style="margin:5px 0 0; font-size: 14px; color: #fff;">${title}</p>
      </div>
    `;
}

function generateMetricRow(label: string, value: string | number, score: number) {
  const color = getScoreColor(score);
  return `
      <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #eee; padding: 10px 0;">
        <span>${label}</span>
        <span style="font-weight: bold; color: ${color};">${value}</span>
      </div>
    `;
}

export function getBasicEmailHtml(data: MarketData): string {
  return `
    <div style="${cleanStyle}">
      ${generateCommonHeader('Basic Market Update')}
      <div style="${cardStyle}">
        <h2 style="color: ${getModeColor(data.marketMode)}; text-align: center;">Current Mode: ${data.marketMode}</h2>
        <p>A quick snapshot of the primary market risk indicators.</p>
        
        ${generateMetricRow('VIX (Volatility)', data.vix.toFixed(2), data.vixScore)}
        ${generateMetricRow('Yield Spread 10y-2y', data.yieldSpread.toFixed(2), data.yieldSpreadScore)}
        ${generateMetricRow('Market Liquidity (Trillions)', '$' + data.liquidity.toFixed(2), data.liquidityScore)}
        
        ${data.sentiment ? `
        <div style="margin-top: 15px; padding: 10px; background: #f0f0f0; border-radius: 4px; font-size: 13px; color: #666;">
             <strong>AI Insight:</strong> 
             <span style="filter: blur(4px);">Market conditions suggest significant volatility ahead...</span>
        </div>
        ` : ''}
      </div>
      
      <div style="${cardStyle}">
        <p style="text-align: center;">Upgrade to Pro to see 6 more indicators and full analysis.</p>
        <div style="text-align: center; margin-top: 15px;">
           <a href="https://crashalert.online/pricing" style="background-color: #D4AF37; color: #000; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 3px;">Upgrade Now</a>
        </div>
      </div>

      <div style="${footerStyle}">
        <p>© ${new Date().getFullYear()} CrashAlert. All rights reserved.</p>
      </div>
    </div>
  `;
}

export function getProEmailHtml(data: MarketData): string {
  return `
    <div style="${cleanStyle}">
      ${generateCommonHeader('Pro Market Risk Report')}
      
      <div style="${cardStyle}">
        <h2 style="color: ${getModeColor(data.marketMode)}; text-align: center;">Market Mode: ${data.marketMode}</h2>
        <p style="text-align: center; color: #666;">Comprehensive analysis of 9 key risk signals.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

        ${data.sentiment ? `
        <div style="background: #FFF8E1; padding: 15px; border-left: 4px solid #D4AF37; margin-bottom: 20px;">
             <strong style="color: #D4AF37;">🤖 AI Insight:</strong> 
             <span style="font-style: italic;">"${data.sentiment}"</span>
        </div>
        ` : ''}

        ${generateMetricRow('VIX', data.vix.toFixed(2), data.vixScore)}
        ${generateMetricRow('Yield Spread (10Y-2Y)', data.yieldSpread.toFixed(2), data.yieldSpreadScore)}
        ${generateMetricRow('S&P 500 P/E', data.sp500pe.toFixed(2), data.sp500peScore)}
        ${generateMetricRow('Liquidity (Trillions)', '$' + data.liquidity.toFixed(2), data.liquidityScore)}
        ${generateMetricRow('Junk Bond Spread', data.junkBondSpread.toFixed(2) + '%', data.junkBondSpreadScore)}
        ${generateMetricRow('Margin Debt', data.marginDebt.toFixed(2), data.marginDebtScore)}
        ${generateMetricRow('Insider Activity', data.insiderActivity.toFixed(2), data.insiderActivityScore)}
        ${generateMetricRow('CFNAI', data.cfnai.toFixed(2), data.cfnaiScore)}
        ${generateMetricRow('1-Month Forecast Signal', data.oneMonthAhead.toFixed(2), data.oneMonthAheadScore)}
      </div>

      <div style="${footerStyle}">
        <p>You are receiving this as a Pro subscriber.</p>
        <p>© ${new Date().getFullYear()} CrashAlert. All rights reserved.</p>
      </div>
    </div>
  `;
}

const aiSection = data.sentiment ? `
      <div style="${cardStyle}; border-left: 4px solid #D4AF37;">
        <h3 style="margin-top: 0; color: #D4AF37; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">🤖 AI Market Analyst</h3>
        <p style="font-style: italic; font-size: 16px; color: #444; margin-bottom: 0;">"${data.sentiment}"</p>
      </div>
    ` : '';

return `
    <div style="${cleanStyle}">
      ${generateCommonHeader('Expert Market Intelligence')}
      
      <div style="${cardStyle}">
        <h2 style="color: ${getModeColor(data.marketMode)}; text-align: center;">Market Evaluation: ${data.marketMode}</h2>
      </div>

      ${aiSection}

      ${chartSection}

      <div style="${cardStyle}">
        <h3 style="margin-top: 0;">Deep Dive Metrics</h3>
        ${generateMetricRow('VIX', data.vix.toFixed(2), data.vixScore)}
        ${generateMetricRow('Yield Spread', data.yieldSpread.toFixed(2), data.yieldSpreadScore)}
        ${generateMetricRow('S&P 500 P/E', data.sp500pe.toFixed(2), data.sp500peScore)}
        ${generateMetricRow('Global Liquidity', '$' + data.liquidity.toFixed(2) + ' T', data.liquidityScore)}
        ${generateMetricRow('High Yield Spread', data.junkBondSpread.toFixed(2) + '%', data.junkBondSpreadScore)}
        ${generateMetricRow('Margin Debt', data.marginDebt.toFixed(2), data.marginDebtScore)}
        ${generateMetricRow('Insider Buy/Sell', data.insiderActivity.toFixed(2), data.insiderActivityScore)}
        ${generateMetricRow('CFNAI', data.cfnai.toFixed(2), data.cfnaiScore)}
        ${generateMetricRow('Algorithm Forecast', data.oneMonthAhead.toFixed(2), data.oneMonthAheadScore)}
      </div>

      <div style="${footerStyle}">
        <p>Expert Level Analysis for Institutional Grade Decisions.</p>
        <p>© ${new Date().getFullYear()} CrashAlert. All rights reserved.</p>
      </div>
    </div>
  `;
}
