# Banned Cards commerce service

This is the Medusa v2 backend for Banned Cards. It owns carts, orders, inventory reservations and payment state.

## Custom TCG catalog

The `tcg-catalog` module separates reusable card metadata from sellable stock:

`game → set → card printing → card listing`

Each `card_listing` stores the physical-sale details: condition, language, finish, price in CLP, quantity, storage location, photos and eventual Medusa product/variant links.

## Local setup

1. Copy `.env.template` to `.env` and replace local secrets.
2. Start PostgreSQL and Redis with the root `docker-compose.yml`.
3. Run `pnpm --filter commerce db:generate` to generate the TCG catalog migration.
4. Run `pnpm --filter commerce db:migrate`.
5. Run `pnpm --filter commerce dev`.

The Medusa Admin will be available at `http://localhost:9000/app` after the service starts.

Do not add Mercado Pago credentials to source control. The future payment provider will validate Mercado Pago's server webhook before marking an order as paid.
