import { pgTable, uuid, text, boolean, jsonb, timestamp, integer, decimal } from 'drizzle-orm/pg-core';

export const subscribers = pgTable('subscribers', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').unique().notNull(),
    plan: text('plan').default('basic'),
    stripeId: text('stripe_id'),
    active: boolean('active').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    selectedAlerts: jsonb('selected_alerts').$type<string[]>(),
    password: text('password'),
});

export const marketMetrics = pgTable('market_metrics', {
    id: uuid('id').defaultRandom().primaryKey(),
    createdAt: timestamp('created_at').defaultNow(),
    vix: decimal('vix', { precision: 10, scale: 2 }),
    yieldSpread: decimal('yield_spread', { precision: 10, scale: 2 }),
    sp500pe: decimal('sp500_pe', { precision: 10, scale: 2 }),
    junkBondSpread: integer('junk_bond_spread'),
    marginDebt: decimal('margin_debt', { precision: 12, scale: 2 }),
    insiderActivity: decimal('insider_activity', { precision: 10, scale: 2 }),
    cfnai: decimal('cfnai', { precision: 10, scale: 2 }),
    liquidity: decimal('central_bank_liquidity', { precision: 12, scale: 2 }),
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
    aggregateRiskScore: integer('aggregate_risk_score'),
    marketMode: text('market_mode'),
    sentiment: text('sentiment'), // AI-generated summary
    rawJson: jsonb('raw_json'),
});
