# Banned Cards

Online TCG storefront, beginning with Magic: The Gathering and designed to support additional games, sealed products, and accessories later.

## Apps

- `apps/storefront` — customer-facing Next.js shop
- `apps/commerce` — reserved for the Medusa backend and its custom TCG catalog module

## Local setup

1. Install Node.js 20+ and pnpm.
2. Run `pnpm install`.
3. Copy `apps/storefront/.env.example` to `apps/storefront/.env.local`.
4. Run `pnpm dev` and open `http://localhost:3000`.

The storefront defaults to the Medusa Store API. Configure the public backend URL, publishable key and CLP region in `.env.local`; see [backend prerequisites](docs/architecture.md). For an offline preview, explicitly set `NEXT_PUBLIC_COMMERCE_MODE=demo`. Checkout and Mercado Pago remain unavailable.

## Architecture

The project follows a pragmatic hexagonal architecture: domain and application code depend on repository ports, while browser storage, Medusa, and Mercado Pago are replaceable adapters. See [docs/architecture.md](docs/architecture.md).

## Moving to macOS

This project is portable between Windows and macOS. Commit or copy the source code, lockfile, and configuration files; do **not** copy `node_modules` or `.next` output. On the Mac install Node.js 20+ and pnpm, then run:

```bash
pnpm install
pnpm dev
```

Keep secrets in `.env.local` on each computer rather than copying them through Git. Docker Desktop is optional locally, but required when you want to run PostgreSQL and the Medusa backend in containers.
