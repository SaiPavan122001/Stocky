-- Initial schema. SQLite for local dev; column types chosen to also work
-- unmodified (or with a trivial UUID/TIMESTAMPTZ swap) if ported to Postgres later.

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);

CREATE TABLE IF NOT EXISTS stocks (
  symbol TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS price_cache (
  symbol TEXT PRIMARY KEY REFERENCES stocks(symbol),
  current_price REAL NOT NULL,
  change REAL NOT NULL,
  change_percent REAL NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS holdings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL REFERENCES stocks(symbol),
  quantity REAL NOT NULL,
  avg_price REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_holdings_user ON holdings(user_id);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL REFERENCES stocks(symbol),
  quantity REAL NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending','processing','credited')),
  claimed_at TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_rewards_user_status ON rewards(user_id, status);
CREATE INDEX IF NOT EXISTS idx_rewards_user_created ON rewards(user_id, created_at);

CREATE TABLE IF NOT EXISTS recent_activity (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('reward','credit')),
  symbol TEXT NOT NULL REFERENCES stocks(symbol),
  quantity REAL NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_user_created ON recent_activity(user_id, created_at);

CREATE TABLE IF NOT EXISTS portfolio_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date TEXT NOT NULL,
  total_value REAL NOT NULL,
  UNIQUE (user_id, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_user_date ON portfolio_snapshots(user_id, snapshot_date);

-- Seed the fixed watchlist matching the original mock data. Symbols are
-- real NSE tickers (required since prices are fetched from yfinance as
-- "<symbol>.NS") -- note HDFCBANK/ICICIBANK, not the mock's informal
-- "HDFC"/"ICICI" shorthand, which aren't valid NSE tickers.
INSERT OR IGNORE INTO stocks (symbol, name) VALUES
  ('RELIANCE', 'Reliance Industries'),
  ('TCS', 'Tata Consultancy Services'),
  ('INFY', 'Infosys Limited'),
  ('HDFCBANK', 'HDFC Bank'),
  ('ICICIBANK', 'ICICI Bank'),
  ('WIPRO', 'Wipro Limited');

-- Seed placeholder prices so the API has something to serve before the
-- price poller (backend-price) makes its first successful fetch.
INSERT OR IGNORE INTO price_cache (symbol, current_price, change, change_percent) VALUES
  ('RELIANCE', 2456.75, 23.45, 0.96),
  ('TCS', 3789.20, -15.30, -0.40),
  ('INFY', 1567.85, 8.90, 0.57),
  ('HDFCBANK', 1678.50, 12.35, 0.74),
  ('ICICIBANK', 1023.40, -5.20, -0.51),
  ('WIPRO', 456.30, 3.15, 0.70);
