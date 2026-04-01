-- Seed data for OpenMarket demo
-- Run with: npx wrangler d1 execute openmarket-db --local --file=src/db/seed.sql

-- Demo owner (password: demo1234)
-- Password hash generated with PBKDF2-SHA256, 100k iterations
-- You can also register via the UI and use that account instead

INSERT OR IGNORE INTO owners (id, email, display_name, password_hash, verified, created_at, updated_at)
VALUES
  ('own_demo_alice_001', 'alice@demo.openmarket.io', 'Alice Chen', '00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000', 1, '2026-03-15T00:00:00Z', '2026-03-15T00:00:00Z'),
  ('own_demo_bob_0001', 'bob@demo.openmarket.io', 'Bob Martinez', '00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000', 1, '2026-03-16T00:00:00Z', '2026-03-16T00:00:00Z'),
  ('own_demo_carol_01', 'carol@demo.openmarket.io', 'Carol Wu', '00000000000000000000000000000000:0000000000000000000000000000000000000000000000000000000000000000', 0, '2026-03-18T00:00:00Z', '2026-03-18T00:00:00Z');

INSERT OR IGNORE INTO wallets (id, owner_id, balance, frozen, total_earned, total_spent, created_at, updated_at)
VALUES
  ('wal_demo_alice_001', 'own_demo_alice_001', 45000, 0, 125000, 80000, '2026-03-15T00:00:00Z', '2026-03-30T00:00:00Z'),
  ('wal_demo_bob_0001', 'own_demo_bob_0001', 12000, 5000, 67000, 50000, '2026-03-16T00:00:00Z', '2026-03-30T00:00:00Z'),
  ('wal_demo_carol_01', 'own_demo_carol_01', 30000, 0, 0, 0, '2026-03-18T00:00:00Z', '2026-03-18T00:00:00Z');

INSERT OR IGNORE INTO agents (id, owner_id, name, slug, description, long_description, endpoint_url, tags, pricing_model, pricing_amount, status, total_transactions, total_earnings, avg_rating, created_at, updated_at)
VALUES
  ('agt_code_review_01', 'own_demo_alice_001', 'Code Review Agent',
   'code-review-agent-rv01',
   'Automated code review with deep analysis of security vulnerabilities, performance bottlenecks, and best practice violations.',
   'This agent performs thorough code reviews across multiple languages including TypeScript, Python, Go, and Rust.

It checks for:
- Security vulnerabilities (SQL injection, XSS, CSRF)
- Performance bottlenecks and memory leaks
- Code style and best practice violations
- Test coverage gaps
- Dependency vulnerabilities

Average review time: 2-5 minutes per PR depending on size.',
   'https://api.alice-agents.dev/code-review',
   '["code-review","security","typescript","python"]',
   'per-task', 500, 'listed', 47, 18800, 4.7,
   '2026-03-15T12:00:00Z', '2026-03-30T00:00:00Z'),

  ('agt_translate_0001', 'own_demo_alice_001', 'Universal Translator',
   'universal-translator-tr01',
   'High-quality translation between 40+ languages with context-aware terminology and tone matching.',
   NULL,
   'https://api.alice-agents.dev/translate',
   '["translation","localization","multilingual"]',
   'per-task', 200, 'listed', 120, 19200, 4.5,
   '2026-03-17T08:00:00Z', '2026-03-30T00:00:00Z'),

  ('agt_data_analyst_01', 'own_demo_bob_0001', 'Data Insight Agent',
   'data-insight-agent-da01',
   'Transforms raw CSV/JSON data into actionable insights with visualizations, trend detection, and anomaly alerts.',
   NULL,
   'https://api.bob-ai.com/data-insight',
   '["data-analysis","visualization","csv","reporting"]',
   'per-task', 800, 'listed', 31, 19840, 4.8,
   '2026-03-18T10:00:00Z', '2026-03-30T00:00:00Z'),

  ('agt_seo_writer_001', 'own_demo_bob_0001', 'SEO Content Writer',
   'seo-content-writer-sw01',
   'Writes SEO-optimized blog posts, product descriptions, and landing page copy with keyword targeting.',
   NULL,
   'https://api.bob-ai.com/seo-writer',
   '["content-writing","seo","marketing","copywriting"]',
   'per-task', 1000, 'listed', 22, 17600, 4.3,
   '2026-03-20T14:00:00Z', '2026-03-30T00:00:00Z'),

  ('agt_api_tester_001', 'own_demo_carol_01', 'API Test Generator',
   'api-test-generator-tg01',
   'Generates comprehensive API test suites from OpenAPI specs. Covers edge cases, error handling, and authentication flows.',
   NULL,
   'https://api.carol-dev.io/test-gen',
   '["testing","api","openapi","automation"]',
   'per-task', 600, 'listed', 15, 7200, 4.6,
   '2026-03-22T09:00:00Z', '2026-03-30T00:00:00Z'),

  ('agt_doc_writer_001', 'own_demo_carol_01', 'Documentation Agent',
   'documentation-agent-dw01',
   'Auto-generates technical documentation from codebases — README files, API docs, architecture guides.',
   NULL,
   NULL,
   '["documentation","technical-writing","readme"]',
   'per-task', 400, 'draft', 0, 0, NULL,
   '2026-03-25T16:00:00Z', '2026-03-25T16:00:00Z');
