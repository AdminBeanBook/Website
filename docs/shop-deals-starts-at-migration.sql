-- Limited-time shop deals: add start time (end already exists as expires_at)
-- Run in Supabase SQL Editor

ALTER TABLE deals ADD COLUMN IF NOT EXISTS starts_at TIMESTAMPTZ;

-- Existing deals without a start time are treated as already live
UPDATE deals SET starts_at = created_at WHERE starts_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_deals_starts_at ON deals(starts_at);
