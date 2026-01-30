import { MarketData } from "../market";

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #333;
  line-height: 1.5;
`;

const containerStyle = `
  max-width: 600px;
  margin: 0 auto;
  background-color: #ffffff;
  padding: 20px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
`;

const headerStyle = `
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
  text-align: center;
`;

const titleStyle = `
  font-size: 24px;
  font-weight: 700;
  color: #111;
  margin: 0;
  letter-spacing: -0.5px;
`;

const riskBadgeStyle = (mode: string) => `
  display: inline-block;
  padding: 6px 12px;
  border-radius: 4px;
  font-weight: bold;
  font-size: 14px;
  color: white;
  background-color: ${mode === 'BULL' ? '#10b981' : mode === 'BEAR' ? '#ef4444' : '#f59e0b'};
  margin-top: 10px;
`;

// Helper to determine risk colors for metrics
function getRiskColor(score: number): string {
    if (score === 2) return '#ef4444'; // Red
    if (score === 1) return '#f59e0b'; // Amber
    return '#10b981'; // Green
}

export function getBasicEmailHtml(data: MarketData): string {
    const isRisky = data.marketMode === 'BEAR' || data.vix > 25;
    const statusColor = isRisky ? '#ef4444' : '#10b981';
    const statusText = isRisky ? 'HIGH RISK' : 'STABLE';

    return `
    <div style="${baseStyles}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <h1 style="${titleStyle}">CrashAlert <span style="color:#f59e0b">.</span></h1>
          <div style="${riskBadgeStyle(data.marketMode)}">${data.marketMode} MARKET</div>
        </div>
        
        <div style="text-align: center; padding: 30px 0;">
          <h2 style="margin: 0; font-size: 16px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Market Status</h2>
          <div style="font-size: 48px; font-weight: 900; color: ${statusColor}; margin: 10px 0;">
            ${statusText}
          </div>
          <p style="color: #666; margin: 0;">
            VIX: <strong>${data.vix.toFixed(2)}</strong> | Yield Spread: <strong>${data.yieldSpread.toFixed(2)}</strong>
          </p>
        </div>

        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #999;">
          <p>Upgrade to Pro for detailed breakdowns and AI predictions.</p>
        </div>
      </div>
    </div>
  `;
}

export function getProEmailHtml(data: MarketData): string {
    return `
    <div style="${baseStyles}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <h1 style="${titleStyle}">CrashAlert <span style="color:#f59e0b">.</span> <span style="font-size:14px; color:#666; font-weight:400; background:#eee; padding:2px 6px; borderRadius:4px;">PRO</span></h1>
        </div>

        <div style="margin-bottom: 25px;">
           <h3 style="margin: 0 0 15px 0; font-size: 18px;">Market Intelligence</h3>
           <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
             <thead>
               <tr style="background: #f9fafb; text-align: left;">
                 <th style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Metric</th>
                 <th style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Value</th>
                 <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">Status</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>VIX</strong> (Volatility)</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.vix.toFixed(2)}</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    <span style="color: ${getRiskColor(data.vixScore)}">●</span>
                 </td>
               </tr>
               <tr>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Yield Spread</strong> (10Y-2Y)</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.yieldSpread.toFixed(2)}%</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    <span style="color: ${getRiskColor(data.yieldSpreadScore)}">●</span>
                 </td>
               </tr>
               <tr>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Liquidity</strong></td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;">$${data.liquidity.toFixed(2)}T</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    <span style="color: ${getRiskColor(data.liquidityScore)}">●</span>
                 </td>
               </tr>
                <tr>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Junk Bond Spread</strong></td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.junkBondSpread.toFixed(2)}%</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    <span style="color: ${getRiskColor(data.junkBondSpreadScore)}">●</span>
                 </td>
               </tr>
                <tr>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>S&P P/E Ratio</strong></td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.sp500pe.toFixed(2)}</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">
                    <span style="color: ${getRiskColor(data.sp500peScore)}">●</span>
                 </td>
               </tr>
             </tbody>
           </table>
        </div>

        <div style="background: #fdfcee; padding: 20px; border-radius: 6px; border: 1px solid #fde047;">
          <h4 style="margin: 0 0 10px 0; color: #854d0e;">AI Market Summary</h4>
          <p style="margin: 0; font-size: 14px; color: #444;">
             Recent signals indicate a <strong>${data.marketMode}</strong> trend. VIX levels suggest ${data.vix > 20 ? 'heightened fear' : 'complacency'}. 
             We recommend monitoring the Yield Spread closely as it remains a key leading indicator.
          </p>
        </div>
      </div>
    </div>
  `;
}

export function getExpertEmailHtml(data: MarketData, chartUrl: string): string {
    return `
    <div style="${baseStyles}">
      <div style="${containerStyle}">
        <div style="${headerStyle}">
          <h1 style="${titleStyle}">CrashAlert <span style="color:#f59e0b">.</span> <span style="font-size:14px; color:white; background:#000; padding:2px 8px; borderRadius:4px;">EXPERT</span></h1>
        </div>

        <div style="margin-bottom: 25px;">
           <img src="${chartUrl}" alt="Trend Analysis Chart" style="width: 100%; border-radius: 8px; border: 1px solid #eee; margin-bottom: 20px;" />
           
           <h3 style="margin: 0 0 15px 0; font-size: 18px;">Institutional Dashboard</h3>
           <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
             <thead>
               <tr style="background: #f9fafb; text-align: left;">
                 <th style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Metric</th>
                 <th style="padding: 10px; border-bottom: 1px solid #e5e7eb;">Value</th>
                 <th style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">Risk Score</th>
               </tr>
             </thead>
             <tbody>
               <tr>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>CFNAI</strong> (Macro)</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.cfnai.toFixed(2)}</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: ${getRiskColor(data.cfnaiScore)}">
                    ${data.cfnaiScore}/2
                 </td>
               </tr>
               <tr>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Margin Debt</strong></td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.marginDebt.toFixed(0)}B</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: ${getRiskColor(data.marginDebtScore)}">
                    ${data.marginDebtScore}/2
                 </td>
               </tr>
               <tr>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Insider Activity</strong></td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee;">${data.insiderActivity.toFixed(2)}</td>
                 <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: ${getRiskColor(data.insiderActivityScore)}">
                    ${data.insiderActivityScore}/2
                 </td>
               </tr>
             </tbody>
           </table>
        </div>

        <div style="background: #000; color: #fff; padding: 20px; border-radius: 6px;">
          <h4 style="margin: 0 0 10px 0; color: #f59e0b;">Deep Dive Prediction</h4>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #ccc;">
             Based on the convergence of falling liquidity and inverted yields, the model predicts a volatility expansion in the next 30 days. 
             The <strong>One-Month Ahead</strong> indicator is currently at <strong>${data.oneMonthAhead.toFixed(2)}</strong>.
          </p>
        </div>
      </div>
    </div>
  `;
}
