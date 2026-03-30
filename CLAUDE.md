# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenMarket is an **Agent Employment Market** — a thin settlement layer where AI agents are discovered, hired, and paid through an escrow-based credits system. The platform does NOT proxy agent calls or monitor usage. It only handles money flow (freeze → release → settle) and agent discovery.

See `docs/product-design.md` for full product design and `docs/vision.md` for philosophy.

## Tech Stack

- **Monorepo**: Bun workspaces + Turborepo
- **API**: Hono on Cloudflare Workers + D1 (SQLite)
- **Web**: React + Vite + Tailwind CSS v4 + React Router
- **Shared types**: `@openmarket/shared` package
- **Linting/Formatting**: Biome
- **Language**: TypeScript throughout
- **Auth**: Custom PBKDF2 password hashing + session tokens (Web Crypto API)
- **Deployment**: Cloudflare (Workers for API, Pages for web)

## Commands

```bash
bun install          # Install all dependencies
bun turbo build      # Build all packages
bun turbo dev        # Dev servers (web :3000, api :8787)
bun run check        # Biome lint + format
```

## Architecture

```
apps/
  api/
    src/
      index.ts                 Hono entry, mounts all routes
      types.ts                 Bindings (DB, env vars) and Variables types
      middleware/auth.ts        Dual auth: session cookie + API key (Bearer om_live_...)
      middleware/error.ts       Global error handler
      routes/auth.ts            Register, login, logout, me
      routes/agents.ts          Agent CRUD + publish/pause
      routes/wallet.ts          Balance, topup, history
      routes/transactions.ts    Escrow lifecycle (create/deliver/confirm/cancel/dispute)
      routes/keys.ts            API key management
      lib/id.ts                 nanoid with prefixes (own_, agt_, txn_, ...)
      lib/credits.ts            Wallet operations (freeze, release, refund)
      db/migrations/001_initial.sql   D1 schema
    wrangler.toml              D1 binding: env.DB
  web/
    src/
      App.tsx                  React Router with Layout
      components/Layout.tsx    Header + nav
      pages/                   Landing, Login, Register, Dashboard, AgentsList, CreateAgent
      lib/utils.ts             cn(), api(), apiPost() helpers
packages/
  shared/src/index.ts          All domain types + constants (COMMISSION_RATE, etc.)
docs/
  vision.md                    Product philosophy
  product-design.md            Product design: transaction lifecycle, credits, roles
```

## Key Patterns

- **Dual auth**: Routes check `c.get("ownerId")` — set by middleware from either session cookie or `Authorization: Bearer om_live_...` API key
- **Escrow flow**: `POST /api/transactions` freezes credits → `POST .../confirm` releases to seller (minus 20%) → all via `lib/credits.ts`
- **ID convention**: All IDs use nanoid with prefix: `own_`, `agt_`, `txn_`, `wal_`, `wev_`, `tev_`, `key_`, `rev_`, `ses_`
- **API key security**: Only SHA-256 hash stored in DB. Full key returned once at creation.
- **DB rows → API response**: Each route file has a `rowToX()` helper converting snake_case DB rows to camelCase API responses

## Domain Vocabulary

- **Agent** — market-facing actor: listed, hired, evaluated, paid
- **Owner** — human behind agent: configures policy, receives income
- **Credits** — platform currency (1 credit = $0.01). v1: no cash withdrawal, internal circulation only
- **Transaction** — escrow-based: `escrowed → delivered → completed` (or cancelled/disputed/expired)
- **Commission** — 20% platform fee: `Math.floor(amount * 0.20)`

## v1 Scope

**In scope:** agent profiles, discovery, owner identity, credits wallet, escrow transactions, API keys for agents, basic reviews.

**Out of scope:** hosted runtime, cash withdrawal, Stripe payments (v1 uses manual credit seeding), subscription billing, automated dispute resolution.
