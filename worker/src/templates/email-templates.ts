
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

function generateMetricRow(label: string, value: string | number, score: number, showHeatmap: boolean = false) {
  const color = getScoreColor(score);
  const info = metricInfo[label] || '';
  const bgColor = showHeatmap ? `${color}15` : 'transparent'; // 15 = roughly 8% opacity

  return `
      <div style="border-bottom: 1px solid #f0f0f0; padding: 12px; background-color: ${bgColor}; border-radius: 4px; margin-bottom: 4px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <span style="font-weight: 600; color: #444;">${label}</span>
          <span style="font-weight: 700; font-size: 15px; color: ${color};">${value}</span>
        </div>
        ${info ? `<div style="font-size: 11px; color: #888; font-style: italic;">${info}</div>` : ''}
      </div>
    `;
}

// Subscription Management Section
function generateSubscriptionLinks(email: string) {
  return `
    <div style="text-align: center; margin-top: 24px; font-size: 12px; color: #999;">
      <a href="https://crashalert.online/dashboard" style="color: #666; text-decoration: underline;">Manage Subscription</a>
      <span style="margin: 0 10px;">•</span>
      <a href="https://crashalert.online/dashboard" style="color: #666; text-decoration: underline;">Cancel Alert</a>
    </div>
  `;
}

// --- Email Templates ---

export function getBasicEmailHtml(data: MarketData): string {
  return `
    <div style="${cleanStyle}">
      <div style="${containerStyle}">
        ${generateCommonHeader('Daily Snapshot')}
        
        <div style="${contentStyle}">
          <div style="text-align: center; margin-bottom: 24px;">
            <p style="text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #888; margin-bottom: 4px;">Market Bias</p>
            <h2 style="color: ${getModeColor(data.marketMode)}; margin: 0; font-size: 32px; font-weight: 800;">${data.marketMode}</h2>
          </div>

          <div style="${cardStyle}">
            <h3 style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px;">Key Indicators</h3>
            ${generateMetricRow('VIX', data.vix.toFixed(2), data.vixScore)}
            ${generateMetricRow('Yield Spread', data.yieldSpread.toFixed(2), data.yieldSpreadScore)}
          </div>
          
          <div style="padding: 16px; background: #fdfcf5; border-radius: 6px; border-left: 4px solid #D4AF37; margin: 24px 0;">
            <div style="font-size: 12px; font-weight: bold; color: #D4AF37; margin-bottom: 4px;">🤖 AI ANALYST TEASER</div>
            <div style="font-size: 14px; color: #666; font-style: italic;">
              ${data.sentiment ? data.sentiment.substring(0, 60) + '...' : 'Market volatility is shifting...'}
            </div>
            <a href="https://crashalert.online/dashboard" style="display: block; margin-top: 8px; font-size: 12px; color: #D4AF37; font-weight: bold; text-decoration: none;">Unlock full analysis &rarr;</a>
          </div>

          <div style="text-align: center; padding: 24px; background: #fff8e1; border-radius: 8px; border: 2px dashed #D4AF37;">
            <h3 style="margin: 0 0 8px; color: #8a6d0b;">Upgrade to Pro</h3>
            <p style="font-size: 13px; color: #666; margin-bottom: 16px;">Get all 9 risk indicators, heatmapped data, and the Expert Risk Graph.</p>
            <a href="https://crashalert.online/dashboard" style="${buttonStyle}">View Plans</a>
          </div>
          
          ${generateSubscriptionLinks('')}
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
        ${generateCommonHeader('Pro Intelligence')}
        
        <div style="${contentStyle}">
          <div style="text-align: center; margin-bottom: 24px;">
             <h2 style="color: ${getModeColor(data.marketMode)}; margin: 0; font-size: 32px; font-weight: 800;">${data.marketMode}</h2>
             <p style="font-size: 13px; color: #666; margin-top: 4px;">Detailed Risk Assessment Dashboard</p>
          </div>

          ${data.sentiment ? `
          <div style="background: #fdfcf5; padding: 16px; border-left: 4px solid #D4AF37; margin-bottom: 24px; border-radius: 0 4px 4px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
               <div style="font-size: 12px; font-weight: bold; color: #D4AF37; text-transform: uppercase; margin-bottom: 4px;">🤖 AI Strategic Summary</div>
               <div style="font-style: italic; color: #1a1a1a; font-size: 15px; line-height: 1.6;">"${data.sentiment}"</div>
          </div>
          ` : ''}

          <div style="${cardStyle}">
            <h3 style="margin: 0 0 16px; font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">Indicator Heatmap (Standard Order)</h3>
            ${generateMetricRow('VIX', data.vix.toFixed(2), data.vixScore, true)}
            ${generateMetricRow('Yield Spread', data.yieldSpread.toFixed(2), data.yieldSpreadScore, true)}
            ${generateMetricRow('S&P 500 P/E', data.sp500pe.toFixed(2), data.sp500peScore, true)}
            ${generateMetricRow('Market Liquidity', '$' + data.liquidity.toFixed(2) + 'T', data.liquidityScore, true)}
            ${generateMetricRow('Junk Bond Spread', data.junkBondSpread.toFixed(2) + '%', data.junkBondSpreadScore, true)}
            ${generateMetricRow('Margin Debt', data.marginDebt.toFixed(2), data.marginDebtScore, true)}
            ${generateMetricRow('Insider Activity', data.insiderActivity.toFixed(2), data.insiderActivityScore, true)}
            ${generateMetricRow('CFNAI', data.cfnai.toFixed(2), data.cfnaiScore, true)}
            ${generateMetricRow('1-Month Forecast', data.oneMonthAhead.toFixed(2), data.oneMonthAheadScore, true)}
          </div>

          ${generateSubscriptionLinks('')}
        </div>

        <div style="${footerStyle}">
          <p>© ${new Date().getFullYear()} CrashAlert. Professional Tier.</p>
        </div>
      </div>
    </div>
  `;
}

export function getExpertEmailHtml(data: MarketData, spyChartUrl: string, riskChartUrl: string, metricCharts: Record<string, string>): string {
  const riskColor = getScoreColor(data.aggregateRiskScore >= 5 ? 2 : (data.aggregateRiskScore >= 3 ? 1 : 0));

  const eventRows = data.upcomingEvents.map(event => `
    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
      <span style="font-size: 13px; color: #333; font-weight: 500;">${event.name}</span>
      <span style="font-size: 12px; color: ${event.daysUntil <= 2 ? '#EF4444' : '#666'}; font-weight: bold;">
        ${event.daysUntil === 0 ? 'TODAY' : `In ${event.daysUntil} days`}
      </span>
    </div>
  `).join('');

  // S&P Projection section - handle missing chartUrl
  const projectionSection = `
    <div style="${cardStyle}">
      <h3 style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px;">S&P 500 Market Projection</h3>
      ${spyChartUrl ? `<img src="${spyChartUrl}" alt="Price Forecast" style="width:100%; border-radius: 4px;" />` : `<div style="padding: 40px; background: #fafafa; text-align: center; color: #999; border: 1px dashed #ddd;">Projection calibrating...</div>`}
    </div>
  `;

  // All 9 Metric Charts in a grid
  const chartItems = Object.entries(metricCharts).map(([label, url]) => `
    <div style="display: inline-block; width: 30%; margin: 1%; vertical-align: top; border: 1px solid #f0f0f0; border-radius: 4px; background: #fff;">
      <div style="padding: 4px; font-size: 9px; font-weight: bold; color: #888; border-bottom: 1px solid #f0f0f0; background: #fafafa; white-space: nowrap; overflow: hidden;">${label}</div>
      <img src="${url}" style="width: 100%; display: block;" />
    </div>
  `).join('');

  // Sorted Metrics Terminal (Risk First)
  const metricsList = [
    { label: 'VIX', value: data.vix.toFixed(2), score: data.vixScore },
    { label: 'Yield Spread', value: data.yieldSpread.toFixed(2), score: data.yieldSpreadScore },
    { label: 'S&P 500 P/E', value: data.sp500pe.toFixed(2), score: data.sp500peScore },
    { label: 'Liquidity', value: '$' + data.liquidity.toFixed(2) + 'T', score: data.liquidityScore },
    { label: 'Junk Bond Spread', value: data.junkBondSpread.toFixed(2) + '%', score: data.junkBondSpreadScore },
    { label: 'Margin Debt', value: data.marginDebt.toFixed(2), score: data.marginDebtScore },
    { label: 'Insider Activity', value: data.insiderActivity.toFixed(2), score: data.insiderActivityScore },
    { label: 'CFNAI', value: data.cfnai.toFixed(2), score: data.cfnaiScore },
    { label: 'Algorithm Forecast', value: data.oneMonthAhead.toFixed(2), score: data.oneMonthAheadScore },
  ];

  const sortedRows = metricsList
    .sort((a, b) => b.score - a.score)
    .map(m => generateMetricRow(m.label, m.value, m.score, true))
    .join('');

  return `
    <div style="${cleanStyle}">
      <div style="${containerStyle}">
        ${generateCommonHeader('Expert Terminal')}
        
        <div style="${contentStyle}">
          
          <div style="display: flex; align-items: start; gap: 20px; background: #000; color: #fff; padding: 24px; border-radius: 8px; margin-bottom: 24px; border-left: 5px solid ${riskColor};">
             <div style="flex: 1;">
               <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #aaa; margin-bottom: 4px;">Expert Risk Signal</div>
               <div style="font-size: 28px; font-weight: 900; color: ${getModeColor(data.marketMode)};">${data.marketMode}</div>
             </div>
             <div style="text-align: right;">
               <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #aaa; margin-bottom: 4px;">Aggregate Score</div>
               <div style="font-size: 32px; font-weight: 900; color: ${riskColor};">${data.aggregateRiskScore}<span style="font-size: 14px; font-weight: 400; color: #666;">/18</span></div>
             </div>
          </div>

          <div style="${cardStyle}">
            <h3 style="margin: 0 0 16px; font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px;">Expert Risk Trend (30D)</h3>
            <img src="${riskChartUrl}" alt="Risk Trend Graph" style="width:100%; border-radius: 4px;" />
          </div>

          ${projectionSection}

          <div style="${cardStyle}">
            <h3 style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px;">Multi-Indicator Visuals</h3>
            <div style="text-align: center;">
              ${chartItems}
            </div>
          </div>

          <div style="${cardStyle} background: #fafafa;">
             <h3 style="margin: 0 0 12px; font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px;">Forthcoming Events</h3>
             ${eventRows}
          </div>

          <div style="background: #fdfcf5; padding: 20px; border-radius: 8px; border: 1px solid #D4AF37; margin-bottom: 24px;">
               <div style="font-size: 12px; font-weight: bold; color: #D4AF37; text-transform: uppercase; margin-bottom: 8px;">🤖 Institutional AI Strategist</div>
               <div style="font-style: italic; color: #1a1a1a; font-size: 16px; line-height: 1.6;">"${data.sentiment}"</div>
          </div>

          <div style="${cardStyle}">
            <h3 style="margin: 0 0 16px; font-size: 12px; text-transform: uppercase; color: #888; letter-spacing: 1px; border-bottom: 1px solid #f0f0f0; padding-bottom: 8px;">Sorted Risk Terminal (Risky First)</h3>
            ${sortedRows}
          </div>

          ${generateSubscriptionLinks('')}
        </div>

        <div style="${footerStyle}">
          <p>Expert Terminal Intelligence. Priority Institutional Stream.</p>
          <p>© ${new Date().getFullYear()} CrashAlert.</p>
        </div>
      </div>
    </div>
  `;
}
