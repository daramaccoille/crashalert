import { pgTable, uuid, text, boolean, jsonb, timestamp, integer, decimal, varchar } from 'drizzle-orm/pg-core';

export const subscribers = pgTable('subscribers', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').unique().notNull(),
    plan: text('plan').default('basic'),
    stripeId: text('stripe_id'),
    active: boolean('active').default(false),
    createdAt: timestamp('created_at').defaultNow(),
    selectedAlerts: jsonb('selected_alerts').$type<string[]>(),
    password: varchar('password', { length: 255 }), // Updated to varchar as requested
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
    marketMode: text('market_mode'),
    sentiment: text('sentiment'),
    oecdValue: decimal('oecd_value', { precision: 10, scale: 4 }),
    oecdMomentum: decimal('oecd_momentum', { precision: 10, scale: 6 }),
    oecdTrend: text('oecd_trend'),
    aggregateRiskScore: integer('aggregate_risk_score'),
    rawJson: jsonb('raw_json'),
});
