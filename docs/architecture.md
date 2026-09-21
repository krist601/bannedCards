# Architecture

Banned Cards uses pragmatic hexagonal boundaries:

```text
Next.js page -> useCommerce presentation hook -> async repository ports
                                             -> demo browser adapters (explicit opt-in)
                                             -> Medusa Store API adapters
Application cart calculations -> framework-free domain types
```

`domain` and `application` import no React, Next.js, Medusa, database or payment code. The composition root in `adapters/commerce-repositories.ts` selects infrastructure. `presentation/use-commerce.ts` coordinates loading, errors and mutations. `page.tsx` renders view state and forwards user actions.

## Medusa integration

The default is Medusa mode. Missing configuration or API failures are visible errors; there is no automatic demo fallback. Copy `apps/storefront/.env.example` to `.env.local` and configure the backend URL, publishable Store API key and Chilean CLP region ID. Set `NEXT_PUBLIC_COMMERCE_MODE=demo` for an offline demo.

- Catalog: paginated `GET /store/products`, with region-specific calculated prices and variant inventory. Each domain catalog ID is a core **variant ID**. Unpriced and non-CLP variants are excluded. Amounts are Medusa v2 currency units, with no cents conversion.
- Cart: lazy `POST /store/carts`, retrieve, add variant, update or delete line item, then render API-returned quantities and unit prices. Domain `lineId` holds the separate Medusa line-item ID. Only the remote cart ID is kept in localStorage, namespaced by backend and region. Demo carts are never imported. Mutations are serialized; API errors preserve the last successful UI state. Missing/completed carts are discarded, while server failures are surfaced.
- Customer: existing-account email/password login, exchange the short-lived JWT for a Medusa session cookie, `GET /store/customers/me`, and `DELETE /auth/session` logout. Passwords and JWTs are not persisted in browser storage. Logout discards the local cart reference. Registration, password recovery, guest-cart transfer and cross-device account carts remain subsequent work.
- Checkout remains disabled. Cart subtotal is the sum of returned unit prices and quantities; shipping, taxes and promotional adjustments are not yet presented. Cart additions do not reserve inventory.

## Backend prerequisites

1. Start PostgreSQL, configure `apps/commerce/.env`, run Medusa migrations and start the backend.
2. Configure a region with currency `clp` and Chile, a sales channel, a stock location and its sales-channel association.
3. Create a publishable API key associated with that sales channel.
4. Publish core Medusa products and variants with CLP prices and inventory at the associated stock location.
5. For local session cookies, use `localhost` consistently for both applications. Configure `STORE_CORS` and `AUTH_CORS` with the exact storefront origin (`http://localhost:3000` locally). Production requires HTTPS and a same-site storefront/backend arrangement with appropriate secure cookie settings; unrelated domains may block session cookies.
6. Use an existing registered Medusa customer to test login. Admin users are not customer accounts.

All `NEXT_PUBLIC_*` values are public. Never supply admin keys, database passwords, JWT signing secrets or Mercado Pago secrets there. Set backend signing secrets independently before production.

## TCG catalog bridge

The custom `tcg-catalog` Product/Listing and card-specific records remain intact. They are not automatically exposed by Medusa's core `/store/products` endpoint. Until a synchronization workflow is added, provision core products/variants through Medusa and record their IDs in `Listing.product_id` / `Listing.variant_id`. Core Medusa pricing and inventory are authoritative for storefront purchases; changing custom `price_clp` / `quantity` alone does not update them.

## Card images

`CatalogueItem.imageUrl` is provider-neutral. The demo catalogue uses Scryfall CDN URLs, while the Medusa adapter reads `metadata.image_url` first and then the core product `thumbnail`. `CardPrinting.image_url` already stores the source image reference in the custom catalogue.

For production, an importer should identify a printing by Scryfall ID or set code plus collector number, copy the selected image into S3-compatible object storage, and save the resulting public URL in Medusa. MinIO can provide the same object-storage interface in local Docker; Cloudflare R2 or another S3-compatible service can be used in production. Keep the original Scryfall ID and source URL so images can be refreshed and attributed. Do not fetch the Scryfall API on storefront page loads.

The adapter currently reads display metadata from the core product and variant (variant values override product values):

| Metadata | Values |
| --- | --- |
| `game` | `magic-the-gathering`, `pokemon`, `one-piece`, `other` |
| `kind` | `single`, `sealed`, `accessory` |
| `set` | Expansion/product series name |
| `collection` | `Middle-earth` or `Latest` |
| `finish`, `condition`, `colors` | Display text |
| `theme` | `fae`, `academy`, `marvel`, `ring`, `shire`, `mist` |

Missing metadata uses neutral defaults. The existing visual design still emphasizes Magic. A future backend workflow should create/link core variants, synchronize descriptive metadata, and migrate commercial ownership away from duplicate custom price/quantity fields.

## Validation

```sh
pnpm --filter storefront test
pnpm --filter storefront build
pnpm --filter commerce exec tsc --noEmit
```

Adapter tests use mocked HTTP responses and exercise pagination, price units, concurrent creation, line identifiers, stale carts, failures, currency validation and session exchange. They do not substitute for live Medusa verification.

Live smoke test after configuration: load real variants; add twice; reload; change quantity; remove a line; exceed stock; log in with valid/invalid customer credentials; reload the session; log out; stop Medusa and verify the error/retry path. Verify checkout stays unavailable.

Next milestones: custom-to-core catalog synchronization, customer registration/recovery and cart transfer, checkout addresses/shipping, Medusa order completion and reservation lifecycle, then Mercado Pago provider and idempotent verified webhooks.

API references: [product pricing](https://docs.medusajs.com/resources/storefront-development/products/price), [session authentication](https://docs.medusajs.com/resources/storefront-development/customers/login), [customer retrieval](https://docs.medusajs.com/resources/storefront-development/customers/retrieve). Route contracts were also checked against the installed Medusa package.

## Set directory and best sellers

The running API lives in the sibling `bannedCards-server` repository. The sidebar reads `GET /store/tcg/sets?limit=10&offset=0`, returning `{ sets, offset, nextOffset, previousOffset, latestSetCodes }`. Sets use the same family grouping and visibility as the CMS (`groupCmsSets`), with one main-set entry per family and no block divisions. A hidden parent hides its whole family; hidden divisions are omitted. Each entry supplies visible member `setCodes`. Filtering and `q` search happen before pagination. Newest sets appear first; undated sets follow, and future releases are labeled Upcoming. No per-set inventory counts are exposed.

The sidebar displays up to 10 sets. “Load more sets” replaces them with the next page; “Load previous sets” appears above the list after page one. Page entry animates vertically, respects reduced motion, and focuses/scrolls the list into view. Search resets pagination; window focus refreshes CMS visibility.

`All singles`, `Latest releases`, and `The hottest` remain above the set directory. Set selection matches the family’s visible `setCodes`. Latest releases uses the two newest released expansion/core/draft-innovation sets and their related products. Hottest uses the backend ranking of paid units in orders created during the rolling last 30 days, subtracting received returns and excluding canceled orders. Rankings are scoped to the publishable key's sales channels. An empty sales history produces an empty list, not an invented ranking.

In the backend, run `pnpm sets:sync` for the initial import or an immediate refresh. The `sync-set-directory` Medusa job runs daily in a shared/worker process. It saves set metadata to the existing Magic catalogue (`handle: magic`) and downloads SVG icons through Medusa's File Module into the configured S3-compatible storage (MinIO locally, S3/R2 in production). Icons are not bundled into the frontend and do not require a frontend deployment when a set is added. Failed downloads retain the previous icon, or display a generic symbol until the next successful sync. A failed Scryfall request leaves the saved directory intact. This imports set metadata only; importing card printings/inventory remains a separate operation.

Demo mode has a small explicit fixture behind `/api/demo/sets` and no fabricated sales. Those routes return 404 outside demo mode. Production does not call Scryfall during page loads.
