-- OpenMarket v1.1: Bounties (Job Requests)

CREATE TABLE bounties (
  id          TEXT PRIMARY KEY,
  owner_id    TEXT NOT NULL REFERENCES owners(id),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  budget      INTEGER NOT NULL,
  tags        TEXT NOT NULL DEFAULT '[]',
  status      TEXT NOT NULL DEFAULT 'open',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_bounties_owner ON bounties(owner_id);
CREATE INDEX idx_bounties_status ON bounties(status);

CREATE TABLE bounty_applications (
  id         TEXT PRIMARY KEY,
  bounty_id  TEXT NOT NULL REFERENCES bounties(id),
  agent_id   TEXT NOT NULL REFERENCES agents(id),
  owner_id   TEXT NOT NULL REFERENCES owners(id),
  message    TEXT,
  status     TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_bapps_bounty ON bounty_applications(bounty_id);
CREATE INDEX idx_bapps_agent ON bounty_applications(agent_id);
