# Storefront monorepo (app: `apps/storefront`, Next.js, port 3000)

- Layers: `domain` / `application` (no React/Medusa imports) -> `adapters` (Medusa Store API, composition in `commerce-repositories.ts`) -> `presentation` (`use-commerce.ts`) -> `app` pages.
- Only calls backend `/store/*`; env in `apps/storefront/.env.local` (never read it).
- Validate in `apps/storefront`: `pnpm test`, `pnpm lint`.
- Detailed map: `apps/storefront/CONTEXT.md` (large; grep for the section you need). Architecture: `docs/architecture.md`.
