import { pgTable, uuid, text, boolean, jsonb, timestamp, integer, decimal } from 'drizzle-orm/pg-core';

export const subscribers = pgTable('subscribers', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').unique().notNull(),
    // plan: basic (free/cheap), pro (metrics), advanced (custom)
    plan: text('plan').default('basic'),
    stripeId: text('stripe_id'),
    active: boolean('active').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    // Enterprise only: Array of selected alert IDs (e.g. ['vix', 'liquidity'])
    selectedAlerts: jsonb('selected_alerts').$type<string[]>(),
    password: text('password'), // Simple text storage for MVP (hash in production)
});

export const marketMetrics = pgTable('market_metrics', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at').defaultNow(),

    // Core Indicators (stored as text to preserve formatting or decimals if needed, 
    // but decimals/integers are better for math. Let's use decimal/numeric for values)

    // VIX: Volatility Index (e.g. 16.45)
    vix: decimal('vix', { precision: 10, scale: 2 }),

    // Yield Curve Spread (10y - 2y) (e.g. -0.71)
    yieldSpread: decimal('yield_spread', { precision: 10, scale: 2 }),

    // S&P 500 P/E Ratio
    sp500pe: decimal('sp500_pe', { precision: 10, scale: 2 }),

    // Junk Bond Spread (basis points, e.g. 340)
    junkBondSpread: integer('junk_bond_spread'),

    // Margin Debt (Billions, e.g. 1126.0)
    marginDebt: decimal('margin_debt', { precision: 12, scale: 2 }),

    // Insider Buy/Sell Ratio (e.g. 0.33)
    insiderActivity: decimal('insider_activity', { precision: 10, scale: 2 }),

    // Chicago Fed National Activity Index (e.g. -0.04)
    cfnai: decimal('cfnai', { precision: 10, scale: 2 }),

    // Central Bank Liquidity / Fed Assets (Trillions, e.g. 7.50)
    liquidity: decimal('central_bank_liquidity', { precision: 12, scale: 2 }),

    // 1-Month Ahead (Consumer Pessimism)
    oneMonthAhead: decimal('one_month_ahead', { precision: 10, scale: 2 }),

    // Volatility Scores (0 = Normal, 1 = Volatile, 2 = Very Volatile)
    vixScore: integer('vix_score'),
    yieldSpreadScore: integer('yield_spread_score'),
    sp500peScore: integer('sp500_pe_score'),
    junkBondSpreadScore: integer('junk_bond_spread_score'),
    marginDebtScore: integer('margin_debt_score'),
    insiderActivityScore: integer('insider_activity_score'),
    cfnaiScore: integer('cfnai_score'),
    liquidityScore: integer('liquidity_score'),
    oneMonthAheadScore: integer('one_month_ahead_score'),

    // Computed Market Mode: BULL, BEAR, NEUTRAL
    marketMode: text('market_mode'),

    // Raw Data Dump (for AI context or extra debugging)
    rawJson: jsonb('raw_json'),
});

// Table to track alerts sent to avoid spamming
export const alertHistory = pgTable('alert_history', {
    id: uuid('id').defaultRandom().primaryKey(),
    sentAt: timestamp('sent_at').defaultNow(),
    type: text('type').notNull(), // 'daily_digest', 'intraday_crash', 'enterprise_custom'
    recipientCount: integer('recipient_count'),
});
