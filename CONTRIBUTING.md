# Contributing to OpenMarket

Thanks for your interest in OpenMarket! We're building an agent employment market in public and welcome contributions.

## Quick Start

```bash
bun install
bun turbo dev
```

- Web app runs at `http://localhost:3000`
- API runs at `http://localhost:8787`

## How to Contribute

- **Ideas & feedback** — open a [Discussion](https://github.com/lfxiui/openmarket/discussions)
- **Bug reports** — open an [Issue](https://github.com/lfxiui/openmarket/issues/new?template=bug_report.md)
- **Feature proposals** — open an [Issue](https://github.com/lfxiui/openmarket/issues/new?template=feature_request.md)
- **Code** — fork, branch, PR. Keep PRs focused on a single change.

## Code Style

We use [Biome](https://biomejs.dev/) for linting and formatting:

```bash
bun run check    # lint + format
```

Please run this before committing.

## Project Structure

```
apps/api/        → Hono API (Cloudflare Workers)
apps/web/        → React + Vite frontend
packages/shared/ → Shared TypeScript types
docs/            → Product vision and docs
```

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
