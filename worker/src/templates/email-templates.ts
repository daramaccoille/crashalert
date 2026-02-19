
import { MarketData } from '../market';

// --- Configuration & Helpers ---

const metricInfo: Record<string, string> = {
  'VIX': 'Expected volatility. >20 signals fear.',
  'Yield Spread 10y-2y': 'Recession indicator. Inversion (<0) is bearish.',
  'Yield Spread': 'Recession signal. Negative is a warning.',
  'S&P 500 P/E': 'Valuation check. >25 is expensive.',
  'Market Liquidity': 'Global money supply. Higher supports assets.',
  'Liquidity': 'Fuel for markets. Trends matter.',
  'Global Liquidity': 'Total money supply (USD). Key driver.',
  'Junk Bond Spread': 'Credit stress. Spikes signal danger.',
  'High Yield Spread': 'Corporate credit risk gauge.',
  'Margin Debt': 'Speculative leverage. High is risky.',
  'Insider Activity': 'Smart money flow. High selling is bearish.',
  'Insider Buy/Sell': 'Ratio of insider sentiment.',
  'CFNAI': 'Economic growth. <-0.70 signals recession.',
  '1-Month Forecast Signal': 'AI-driven rapid projection.',
  'Algorithm Forecast': 'Proprietary short-term model.',
};

// --- Styles ---

const cleanStyle = `
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  line-height: 1.5;
  color: #333;
  max-width: 600px;
  margin: 0 auto;
  padding: 0;
  background-color: #f4f4f5;
`;

const containerStyle = `
  background-color: #ffffff;
  margin: 20px auto; 
  max-width: 600px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
`;

const headerStyle = `
  background: linear-gradient(135deg, #1a1a1a 0%, #000000 100%);
  color: #D4AF37; /* Gold */
  padding: 24px;
  text-align: center;
  border-bottom: 3px solid #D4AF37;
`;

const contentStyle = `
  padding: 24px;
`;

const cardStyle = `
  background-color: #fff;
  border: 1px solid #eee;
  border-radius: 6px;
  padding: 16px;
  margin-bottom: 16px;
`;

const footerStyle = `
  text-align: center;
  font-size: 11px;
  color: #888;
  padding: 20px;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
`;

const buttonStyle = `
  display: inline-block;
  background-color: #D4AF37;
  color: #000;
  padding: 12px 24px;
  text-decoration: none;
  font-weight: bold;
  border-radius: 4px;
  margin-top: 10px;
`;

// --- Logic ---

function getModeColor(mode: string) {
  if (mode === 'BULL') return '#10B981'; // Green
  if (mode === 'BEAR') return '#EF4444'; // Red
  return '#F59E0B'; // Amber/Neutral
}

function getScoreColor(score: number) {
  if (score === 0) return '#10B981'; // Green (Safe)
  if (score === 1) return '#F59E0B'; // Amber (Caution)
  return '#EF4444'; // Red (Danger)
}

function generateCommonHeader(title: string) {
  return `
      <div style="${headerStyle}">
        <h1 style="margin:0; font-size: 26px; letter-spacing: 1px; font-weight: 700;">CRASH ALERT</h1>
        <p style="margin:4px 0 0; font-size: 13px; color: #ccc; text-transform: uppercase; letter-spacing: 2px;">${title}</p>
      </div>
    `;
}

function generateMetricRow(label: string, value: string | number, score: number) {
  const color = getScoreColor(score);
  const info = metricInfo[label] || '';

  return `
      <div style="border-bottom: 1px solid #f0f0f0; padding: 12px 0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span style="font-weight: 600; color: #444;">${label}</span>
          <span style="font-weight: 700; font-size: 15px; color: ${color};">${value}</span>
        </div>
        ${info ? `<div style="font-size: 11px; color: #888; font-style: italic;">${info}</div>` : ''}
      </div>
    `;
}

// --- Email Templates ---

export function getBasicEmailHtml(data: MarketData): string {
  return `
    <div style="${cleanStyle}">
      <div style="${containerStyle}">
        ${generateCommonHeader('Basic Market Snapshot')}
        
        <div style="${contentStyle}">
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #888; margin-bottom: 4px;">Current Market Status</p>
            <h2 style="color: ${getModeColor(data.marketMode)}; margin: 0; font-size: 28px;">${data.marketMode}</h2>
          </div>

          <div style="${cardStyle}">
            <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #555;">Key Indicators</h3>
            ${generateMetricRow('VIX', data.vix.toFixed(2), data.vixScore)}
            ${generateMetricRow('Yield Spread 10y-2y', data.yieldSpread.toFixed(2), data.yieldSpreadScore)}
            ${generateMetricRow('Market Liquidity', '$' + data.liquidity.toFixed(2) + 'T', data.liquidityScore)}
          </div>
          
          ${data.sentiment ? `
          <div style="margin-top: 16px; padding: 12px; background: #fafafa; border-radius: 6px; font-size: 13px; color: #555; border-left: 3px solid #ccc;">
               <strong>🤖 AI Hint:</strong> 
               <span style="filter: blur(3px); user-select: none;">Volatility is rising, suggesting defensive positioning...</span>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 32px; padding: 20px; background: #fff8e1; border-radius: 6px; border: 1px dashed #D4AF37;">
            <p style="margin: 0 0 10px; font-weight: 600; color: #8a6d0b;">Unlock Pro Insights & Full Analysis</p>
            <p style="font-size: 12px; margin-bottom: 16px; color: #666;">Get access to 6 more key indicators, AI analysis, and trend forecasts.</p>
            <a href="https://crashalert.online/dashboard" style="${buttonStyle}">Upgrade to Pro</a>
          </div>
        </div>
  
        <div style="${footerStyle}">
          <p>© ${new Date().getFullYear()} CrashAlert. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

export function getProEmailHtml(data: MarketData): string {
  return `
    <div style="${cleanStyle}">
      <div style="${containerStyle}">
        ${generateCommonHeader('Pro Market Intelligence')}
        
        <div style="${contentStyle}">
          <div style="text-align: center; margin-bottom: 24px;">
             <p style="text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #888; margin-bottom: 4px;">Market Risk Assessment</p>
             <h2 style="color: ${getModeColor(data.marketMode)}; margin: 0; font-size: 28px;">${data.marketMode}</h2>
          </div>

          ${data.sentiment ? `
          <div style="background: #fdfcf5; padding: 16px; border-left: 4px solid #D4AF37; margin-bottom: 24px; border-radius: 0 4px 4px 0;">
               <div style="font-size: 12px; font-weight: bold; color: #D4AF37; text-transform: uppercase; margin-bottom: 4px;">🤖 AI Analyst Insight</div>
               <div style="font-style: italic; color: #444; font-size: 14px; line-height: 1.5;">"${data.sentiment}"</div>
          </div>
          ` : ''}

          <div style="${cardStyle}">
            <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; color: #555; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Risk Dashboard</h3>
            ${generateMetricRow('VIX', data.vix.toFixed(2), data.vixScore)}
            ${generateMetricRow('Yield Spread (10Y-2Y)', data.yieldSpread.toFixed(2), data.yieldSpreadScore)}
            ${generateMetricRow('S&P 500 P/E', data.sp500pe.toFixed(2), data.sp500peScore)}
            ${generateMetricRow('Liquidity', '$' + data.liquidity.toFixed(2) + 'T', data.liquidityScore)}
            ${generateMetricRow('Junk Bond Spread', data.junkBondSpread.toFixed(2) + '%', data.junkBondSpreadScore)}
            ${generateMetricRow('Margin Debt', data.marginDebt.toFixed(2), data.marginDebtScore)}
            ${generateMetricRow('Insider Activity', data.insiderActivity.toFixed(2), data.insiderActivityScore)}
            ${generateMetricRow('CFNAI', data.cfnai.toFixed(2), data.cfnaiScore)}
            ${generateMetricRow('1-Month Forecast Signal', data.oneMonthAhead.toFixed(2), data.oneMonthAheadScore)}
          </div>

          <div style="text-align: center; margin-top: 24px;">
            <a href="https://crashalert.online/dashboard" style="font-size: 12px; color: #888; text-decoration: underline;">Manage Subscription / Upgrade</a>
          </div>
        </div>

        <div style="${footerStyle}">
          <p>You are receiving this as a Pro subscriber.</p>
          <p>© ${new Date().getFullYear()} CrashAlert. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}

export function getExpertEmailHtml(data: MarketData, chartUrl: string): string {
  const aiSection = data.sentiment ? `
      <div style="background: linear-gradient(to right, #ffffff, #fdfcf5); padding: 16px; border-left: 4px solid #D4AF37; margin-bottom: 24px; border-radius: 0 4px 4px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.03);">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <span style="font-size: 16px; margin-right: 6px;">🤖</span>
          <span style="font-size: 12px; font-weight: bold; color: #D4AF37; text-transform: uppercase;">Strategic AI Analysis</span>
        </div>
        <div style="font-style: italic; color: #333; font-size: 15px; line-height: 1.6;">"${data.sentiment}"</div>
      </div>
    ` : '';

  const chartSection = chartUrl ? `
      <div style="${cardStyle} padding: 0; overflow: hidden;">
        <div style="padding: 12px 16px; background: #f9f9f9; border-bottom: 1px solid #eee;">
            <h3 style="margin: 0; font-size: 14px; color: #444;">Market Forecast Chart</h3>
        </div>
        <img src="${chartUrl}" alt="Market Forecast" style="width: 100%; display: block;" />
        <div style="padding: 8px; text-align: center; font-size: 11px; color: #999;">
           Data based on VIX & volatility trends.
        </div>
      </div>
  ` : '';

  return `
    <div style="${cleanStyle}">
      <div style="${containerStyle}">
        ${generateCommonHeader('Expert Market Intelligence')}
        
        <div style="${contentStyle}">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; background: #111; color: #fff; padding: 16px; border-radius: 6px;">
             <div>
               <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #aaa;">Market Status</div>
               <div style="font-size: 24px; font-weight: bold; color: ${getModeColor(data.marketMode)};">${data.marketMode}</div>
             </div>
             <div style="text-align: right;">
               <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #aaa;">Risk Score</div>
               <div style="font-size: 24px; font-weight: bold;">${data.vix.toFixed(1)}</div>
             </div>
          </div>

          ${aiSection}

          ${chartSection}

          <div style="${cardStyle}">
            <h3 style="margin: 0 0 16px; font-size: 14px; text-transform: uppercase; color: #555; border-bottom: 2px solid #f0f0f0; padding-bottom: 8px;">Deep Dive Metrics</h3>
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

          <div style="text-align: center; margin-top: 24px;">
             <a href="https://crashalert.online/dashboard" style="font-size: 12px; color: #888; text-decoration: underline;">Manage Pro Subscription</a>
          </div>
        </div>

        <div style="${footerStyle}">
          <p>Expert Level Analysis for Institutional Grade Decisions.</p>
          <p>© ${new Date().getFullYear()} CrashAlert. All rights reserved.</p>
        </div>
      </div>
    </div>
  `;
}
