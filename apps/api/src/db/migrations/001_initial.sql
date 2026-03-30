-- OpenMarket v1 Initial Schema
-- Cloudflare D1 (SQLite)

CREATE TABLE owners (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE,
  display_name  TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  avatar_url    TEXT,
  verified      INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_owners_email ON owners(email);

CREATE TABLE agents (
  id                 TEXT PRIMARY KEY,
  owner_id           TEXT NOT NULL REFERENCES owners(id),
  name               TEXT NOT NULL,
  slug               TEXT NOT NULL UNIQUE,
  description        TEXT NOT NULL DEFAULT '',
  long_description   TEXT,
  endpoint_url       TEXT,
  tags               TEXT NOT NULL DEFAULT '[]',
  pricing_model      TEXT NOT NULL DEFAULT 'per-task',
  pricing_amount     INTEGER NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'draft',
  total_transactions INTEGER NOT NULL DEFAULT 0,
  total_earnings     INTEGER NOT NULL DEFAULT 0,
  avg_rating         REAL,
  created_at         TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at         TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_agents_owner ON agents(owner_id);
CREATE INDEX idx_agents_status ON agents(status);
CREATE INDEX idx_agents_slug ON agents(slug);

CREATE TABLE wallets (
  id           TEXT PRIMARY KEY,
  owner_id     TEXT NOT NULL UNIQUE REFERENCES owners(id),
  balance      INTEGER NOT NULL DEFAULT 0,
  frozen       INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent  INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_wallets_owner ON wallets(owner_id);

CREATE TABLE wallet_events (
  id            TEXT PRIMARY KEY,
  wallet_id     TEXT NOT NULL REFERENCES wallets(id),
  type          TEXT NOT NULL,
  amount        INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  reference_id  TEXT,
  description   TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_wallet_events_wallet ON wallet_events(wallet_id);

CREATE TABLE transactions (
  id              TEXT PRIMARY KEY,
  buyer_owner_id  TEXT NOT NULL REFERENCES owners(id),
  seller_owner_id TEXT NOT NULL REFERENCES owners(id),
  agent_id        TEXT NOT NULL REFERENCES agents(id),
  amount          INTEGER NOT NULL,
  commission      INTEGER NOT NULL DEFAULT 0,
  seller_payout   INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'escrowed',
  description     TEXT,
  metadata        TEXT,
  expires_at      TEXT NOT NULL,
  delivered_at    TEXT,
  completed_at    TEXT,
  disputed_at     TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tx_buyer ON transactions(buyer_owner_id);
CREATE INDEX idx_tx_seller ON transactions(seller_owner_id);
CREATE INDEX idx_tx_agent ON transactions(agent_id);
CREATE INDEX idx_tx_status ON transactions(status);

CREATE TABLE transaction_events (
  id             TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL REFERENCES transactions(id),
  event_type     TEXT NOT NULL,
  actor_type     TEXT NOT NULL,
  actor_id       TEXT,
  metadata       TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_tx_events_tx ON transaction_events(transaction_id);

CREATE TABLE api_keys (
  id           TEXT PRIMARY KEY,
  owner_id     TEXT NOT NULL REFERENCES owners(id),
  key_hash     TEXT NOT NULL UNIQUE,
  key_prefix   TEXT NOT NULL,
  name         TEXT NOT NULL DEFAULT 'default',
  last_used_at TEXT,
  revoked      INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_api_keys_owner ON api_keys(owner_id);
CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);

CREATE TABLE reviews (
  id             TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL UNIQUE REFERENCES transactions(id),
  agent_id       TEXT NOT NULL REFERENCES agents(id),
  reviewer_id    TEXT NOT NULL REFERENCES owners(id),
  rating         INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment        TEXT,
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_reviews_agent ON reviews(agent_id);

CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  owner_id   TEXT NOT NULL REFERENCES owners(id),
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_sessions_token ON sessions(token_hash);
CREATE INDEX idx_sessions_owner ON sessions(owner_id);
