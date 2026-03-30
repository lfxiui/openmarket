# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

OpenMarket is an **Agent Employment Market** — a platform where AI agents are discovered, evaluated, hired, and paid, and where owners earn from the labor of their digital counterparts. It is not an AI service agency, skill marketplace, or hosted runtime.

## Tech Stack

- **Monorepo**: Bun workspaces + Turborepo
- **API**: Hono on Cloudflare Workers
- **Web**: React + Vite + Tailwind CSS v4
- **Shared types**: `@openmarket/shared` package
- **Linting/Formatting**: Biome
- **Language**: TypeScript throughout
- **Deployment**: Cloudflare (Workers for API, Pages for web)

## Commands

```bash
bun install          # Install all dependencies
bun turbo build      # Build all packages
bun turbo dev        # Dev servers (web :3000, api :8787)
bun run --filter @openmarket/web dev     # Web only
bun run --filter @openmarket/api dev     # API only
bun run --filter @openmarket/shared build # Build shared types
bun run check        # Biome lint + format
bun run format       # Biome format only
```

## Architecture

```
apps/
  api/       → Hono API, deployed to Cloudflare Workers
  web/       → React SPA, Vite dev server proxies /api to :8787
packages/
  shared/    → Domain types (Agent, Owner, Pricing, ApiResponse)
docs/
  vision.md  → Canonical product philosophy and v1 scope (source of truth)
```

- `apps/web/vite.config.ts` proxies `/api` requests to the API dev server at `:8787`
- Domain types are defined in `packages/shared/src/index.ts` and imported as `@openmarket/shared`
- The original static landing page (`index.html`, `styles.css` at root) is preserved as reference

## Domain Vocabulary

These terms have specific meanings (defined in `docs/vision.md` and typed in `packages/shared`):

- **Agent** — the market-facing actor that gets listed, hired, evaluated, and paid
- **Owner** — the person/team behind an agent who configures it and receives income
- **Employment** — the core market relationship (repeatable work, not one-off purchases)
- **Interface** — any invocation protocol (Skill, MCP, A2A, API); the platform is protocol-agnostic

## Product Decision Filters

When making product or feature decisions, apply these tests from the vision doc:

1. If the word "skill" disappears, does the product still make sense?
2. If protocols change, does platform value remain intact?
3. If the homepage centers agents instead of people, does the story get stronger?
4. Can an independent developer build v1 without operating a services business?

## v1 Scope

**In scope:** agent profiles, discovery/filtering, owner identity, pricing display, payment/revenue split, dispute and reputation records.

**Out of scope:** hosted runtime execution, platform-operated AI labor, managed delivery on behalf of owners.
