CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS earning_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT NOT NULL,
  username TEXT,
  amount NUMERIC(14, 2) NOT NULL,
  prize_pool_contribution NUMERIC(14, 2) NOT NULL,
  net_amount NUMERIC(14, 2) NOT NULL,
  updated_score NUMERIC(14, 2) NOT NULL,
  week_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reward_distributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id TEXT NOT NULL,
  player_id TEXT,
  username TEXT,
  rank INTEGER,
  score NUMERIC(14, 2),
  reward_amount NUMERIC(14, 2),
  reward_percentage NUMERIC(8, 4),
  total_weekly_earning NUMERIC(14, 2),
  prize_pool NUMERIC(14, 2),
  payload JSONB NOT NULL,
  distributed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  total_weekly_earning NUMERIC(14, 2),
  prize_pool NUMERIC(14, 2),
  reward_count INTEGER,
  payload JSONB NOT NULL,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_players_player_id
  ON players (player_id);

CREATE INDEX IF NOT EXISTS idx_players_created_at
  ON players (created_at);

CREATE INDEX IF NOT EXISTS idx_earning_ledger_player_id
  ON earning_ledger (player_id);

CREATE INDEX IF NOT EXISTS idx_earning_ledger_week_id
  ON earning_ledger (week_id);

CREATE INDEX IF NOT EXISTS idx_earning_ledger_created_at
  ON earning_ledger (created_at);

CREATE INDEX IF NOT EXISTS idx_reward_distributions_player_id
  ON reward_distributions (player_id);

CREATE INDEX IF NOT EXISTS idx_reward_distributions_week_id
  ON reward_distributions (week_id);

CREATE INDEX IF NOT EXISTS idx_reward_distributions_created_at
  ON reward_distributions (created_at);

CREATE INDEX IF NOT EXISTS idx_weekly_settlements_week_id
  ON weekly_settlements (week_id);

CREATE INDEX IF NOT EXISTS idx_weekly_settlements_created_at
  ON weekly_settlements (created_at);
