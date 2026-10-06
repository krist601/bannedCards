# Frontend context

Verified against source: 2026-09-21. Read this before broad repository exploration. Paths below are relative to `apps/storefront` unless stated otherwise.

## Project and commands

- Banned Cards: English-language Magic singles shop for Chile; prices are CLP currency units, without cents conversion.
- Next.js 15 App Router, React 19, TypeScript, plain global CSS; pnpm workspace (root declares pnpm 11.19.0).
- From repository root: `pnpm dev` (port 3000), `pnpm build`, `pnpm lint`, `pnpm --filter storefront test`, `pnpm --filter storefront exec tsc --noEmit`.
- Tests compile selected modules using `tsconfig.test.json`, then run Node's test runner on `tests/*.test.cjs`. Add new tested modules to that config when needed.
- `next.config.ts` separates `.next-dev` from production `.next`. ESLint uses `eslint.config.mjs`, Next presets and FlatCompat; CommonJS is permitted in tests.
- The active backend is the sibling repository `../bannedCards-server` relative to this repository root. `apps/commerce` is an older scaffold, not the running backend. Inspect the sibling only for backend tasks.

## File map and boundaries

| Area | Files under `src/` | Responsibility |
| --- | --- | --- |
| Shop | `app/page.tsx`, `app/globals.css` | Client homepage, search, catalogue, cart drawer, login modal; cream/green styling and responsive card grid |
| Shell | `app/layout.tsx` | Metadata and English document language |
| Commerce state | `presentation/use-commerce.ts` | Initial loading, retries, serialized user mutations, cart/customer state |
| Composition | `adapters/commerce-repositories.ts` | Explicit demo vs Medusa selection |
| API adapter | `adapters/medusa-repositories.ts` | Card mapping, catalogue pagination, remote cart, cookie sessions |
| Local demo | `adapters/demo-catalogue-repository.ts`, `adapters/browser-repositories.ts` | Fixture cards and browser persistence |
| Core | `domain/commerce.ts`, `application/ports.ts`, `application/cart.ts` | Framework-free types, repository interfaces and cart calculations |
| Browsing | `application/catalogue.ts`, `application/filter-catalogue.ts` | Availability/price ordering, search, exact set filtering, sales ranking |
| Set directory | `domain/set-directory.ts`, `adapters/set-directory-repository.ts` | Set/page contracts and Store API requests |
| Sidebar | `presentation/use-set-directory.ts`, `presentation/set-sidebar.tsx` | Debounced set search, cancellation, pagination, persistent filters and SVG icons |
| Images | `presentation/card-image.tsx` | Card images with fallback; existing Next `<img>` lint warning |
| Other routes | `app/api/demo/{sets,hottest}/route.ts`, `app/cms/page.tsx` | Demo-only APIs; `/cms` redirects to `CMS_URL` or localhost:3001 |

Keep `domain`/`application` independent of React, Next and Medusa. UI forwards actions through presentation hooks/adapters; avoid putting HTTP logic in the page.

## API contracts and invariants

- Default mode is Medusa; never silently fall back to demo. `.env.local` uses `NEXT_PUBLIC_COMMERCE_MODE`, `NEXT_PUBLIC_MEDUSA_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_MEDUSA_REGION_ID`. Demo requires mode `demo`. Never put secrets in public environment variables.
- Catalogue: `GET /store/tcg/cards?grouped=true&limit=40&offset=…&q=…` with optional comma-separated `sets` or ordered `ranked` variant IDs returns `{cards,count,nextOffset}` (count/offset measure printing-language groups). Backend filters/sorts before pagination and keeps all condition/finish rows together. `catalogue-page-repository.ts` and `use-catalogue-pages.ts` fetch one page, append near the bottom via IntersectionObserver, cancel stale requests, debounce searches and offer retry/manual load. `use-commerce.ts` loads cart/session only. Legacy bulk adapter remains for compatibility, not used by the shop.
- Backend pagination currently reads/project the catalogue in batches per request to preserve global stock/price ordering; browser transfer is paginated, but database work is not yet indexed pagination. Revisit for larger catalogues.
- Card IDs represent variants when sellable; unlisted printings remain visible. Preserve `attributes.printingId`, `attributes.variantId`, `setCode`, nullable price and stock. Only `stock === 0` means out of stock; null means unknown/unmanaged.
- Ordinary ordering: available first, descending price, unknown prices last within availability groups. Hottest preserves the API's sales order instead.
- Cart uses `/store/carts` and line-item endpoints. Variant IDs add items; separate `lineId` updates/removes them. Server prices and quantities are authoritative. Mutations are serialized; only the remote cart ID is persisted in Medusa mode.
- Customer login exchanges an email/password JWT for a cookie session. Requests include credentials; passwords/JWTs are not persisted. Checkout and Mercado Pago remain disabled; adding to cart does not reserve inventory.

## Hero carousel and bulk finder

- `presentation/hero-carousel.tsx`: manual Discover / Bulk finder promotional slides. Second slide’s Open bulk finder button opens a native modal dialog for stock checking and reviewed Add to cart. Escape/close restores focus, background scrolling is locked, and draft/results remain when reopening. View cart closes the modal first.
- `application/bulk-cards.ts` accepts `1x Name`, `1 Name F`, `4x Name (SET)`, either suffix order. Names match exactly ignoring case/whitespace; no F means normal. LOR/TLR alias to LTR with a visible note. Limit 50 lines, 1–999 per line.
- `adapters/bulk-card-repository.ts` searches paginated stock per unique name; checks finish/set after retrieval. Cheapest available variants allocated first; per-line dropdown overrides choice. Planning subtracts existing cart and prior lines; preview reports missing/partial quantities and exact language/condition/price.
- `useCommerce.addBulk` serializes writes, reloads cart first, preserves successful writes on partial failure, and never automatically retries a failed add. `CartRepository.add(item,quantity=1)` sends one quantity-aware request per allocation. Search/review does not mutate cart.

## Themes

- Supplied brand originals live in `public/brand/`. `presentation/brand-logo.tsx` uses the white horizontal logo for dark schemes, purple horizontal for light schemes, the color symbol on mobile, and the square full logo in the footer. Next Image serves resized versions; layout metadata registers the supplied favicon and square social image.

- `src/config/themes.ts` is the sole palette registry: Dark is default using the requested purple/amber palette; Light is included. Add a unique id/name/scheme/colors entry to add another theme automatically to the picker. `defaultTheme` controls first visits.
- Semantic CSS variables (`--background`, `--surface`, `--primary`, `--accent`, `--text`, `--muted`, `--border`, contrast colors and `--link`) style the UI. Legacy CSS names alias them. `ThemeProvider` updates `data-theme` and a one-year cookie. Layout reads that cookie server-side so reloads render the chosen theme without a flash. No changes to card art colors.

## Card presentation

- `application/group-cards.ts` groups condition and finish variants after filtering/sorting. Match game, name, set, collector number, printing/art identity, image and language. Missing identity or duplicate same-condition listings remain separate.
- `presentation/product-card.tsx` renders NM/LP/MP/HP/DMG tabs (plus any other stored condition); missing conditions are disabled. Unlisted cards show NM selected but disabled, no Not Listed tab, and Out of stock. A continuous border encloses each condition panel’s price, Add button, stock and cart information. Selection controls exact listing price, stock and cart variant. Finish tabs above the image always show Normal then Foil, with missing finishes disabled; default to available Normal, otherwise available Foil. Additional finishes follow; conditions and cart data follow the chosen finish. Languages stay separate; language flags sit left of the card name (no repeated finish description) and have readable labels, with text fallback for unknown languages. Catalogue count comes from server groups; loaded cards append without client re-sorting.

- `presentation/card-wear.tsx` adds a decorative SVG edge-wear overlay for selected LP/MP/HP/DMG, progressively stronger. NM/unlisted remain clean. Coordinates are deterministic, scale with the card, and never change source images or intercept input.

## Sidebar decisions to preserve

- Mobile (≤800px) has a fixed bottom shop bar with the live cart subtotal/count and cart button on all shop pages. Singles filters render their trigger into that bar via `mobile-filter-slot`. The mobile header hides its cart button and centers the theme-specific horizontal logo, with the menu at the right. Desktop keeps the header cart.

- Show out-of-stock cards checkbox defaults off. `showOutOfStock=false` excludes fully sold-out groups before server pagination; groups with any available variant keep all their condition/finish rows. Toggling resets pagination; demo follows the same rule.

- The separate “Explore collections” homepage section was removed.
- Always keep **Latest added**, **Latest releases**, **All singles** in that order above the set list. Latest added is selected by default on first load. The old `Collection` type still exists for compatibility; sidebar selection uses `CatalogueFilter`.
- `GET /store/tcg/sets?limit=10&offset=0` returns `{ sets, offset, nextOffset, previousOffset, latestSetCodes }`. One entry per CMS set family, no block headings. Backend reuses `groupCmsSets`: hidden parents hide the entire family; hidden divisions are excluded. CMS visibility defaults missing values to enabled. Each entry includes `setCodes` for its visible divisions. Grouping, visibility and search happen before pagination; division searches return their main set.
- Card size slider tops the sidebar: 1× default (original minimum) through 2.5×, step 0.1. Page state drives CSS grid sizing; cards reflow and stay within narrow viewports.
- Desktop filters stick 88px below the viewport top within the catalogue layout, stopping at its bottom. At widths ≤800px, `presentation/mobile-filters.tsx` replaces the inline sidebar with a fixed Filters button and a native modal bottom sheet. Filters apply immediately; Done, close, backdrop and Escape animate dismissal. The sheet scrolls internally, locks background scrolling, traps focus, restores trigger focus and respects reduced motion.
- Show at most 10 sets. Bottom **Load more sets** replaces the page; top **Load previous sets** goes back. Animate vertical page entry (opposite direction when going back), focus the list and scroll it into view; respect reduced motion. Search resets to page one. Window focus refreshes visibility after CMS changes. No inventory counts beside sets.
- Sets sort newest first, with undated sets last. Upcoming releases are labeled. Selection matches any lowercase code in the entry’s `setCodes`, including visible related releases.
- Icons appear left of set names, with a generic fallback. Backend `pnpm sets:sync` and a daily Medusa job sync Scryfall metadata/icons into owned S3-compatible storage (MinIO locally). New sets need no frontend deployment. Do not fetch Scryfall on browser page loads.
- Latest added uses `sort=added` on the paginated card API: printing creation timestamp (`created_at` → `added_at`), newest first, before price. Stock filter still applies. Import updates/restocking do not reset creation time. The frontend no longer fetches hottest rankings. Legacy `GET /store/tcg/hottest` returns `{ variantIds, since }`: paid units in orders created over the last 30 days, minus received returns, excluding canceled orders and scoped to the Store API key's sales channels. No sales means an empty state, not fabricated rankings.
- Demo directory is a small fixture; demo hottest is empty. Demo API routes return 404 outside demo mode.

## Handoff / verification limits

- Visibility compatibility: CMS historically defaults missing values to enabled. Backend `src/scripts/backfill-set-visibility.ts` materializes that default (run with `pnpm exec medusa exec ./src/scripts/backfill-set-visibility.ts`); existing saved values are preserved. Sync/import now initialize new sets to visible. Store API now follows CMS family visibility. Browser verified populated ten-set pages and next-page replacement.
- Last observed checks: 17 frontend and 29 backend tests passed; frontend lint/typecheck and backend typecheck/build passed. Frontend lint retains the existing card-image warning. Final frontend production build completion was not captured. Do not assume local services are still running.
- Known pending backend edge case: `latestSetCodes` picks the two newest eligible set records without excluding `parent_set_code`. Two related products can therefore occupy both slots. The proposed fix to choose distinct main releases was blocked before execution; it is not applied.
- Changes may be uncommitted; inspect status and preserve unrelated edits, including the `/cms` route. Consult repository-root `docs/architecture.md` only for deeper context and verify older claims against code.

## Sealed storefront (2026-09-27)

- `/` is Home: hero links to Sealed and Singles, plus the bulk-finder modal; a horizontally scrolling row of the ten newest sealed options and a More tile links to `/sealed`, followed by eight latest-added singles.
- `/sealed` has set and category promotional carousels, Newest / Almost gone / Deals rows (up to ten options + More tile each), then the complete paginated sealed catalogue. `/sealed/{bundles,precons,booster-boxes,booster-packs,extras}`, `/sealed/sets/[slug]`, and `/sealed/collections/{newest,almost-gone,deals}` are full pages with breadcrumbs. Secret Lair drops and bundles belong under Extras. Language is a displayed attribute and filter, never a category/page branch.
- Shared shell/cart is `presentation/shop.tsx`. Home / Sealed / Singles navigation occupies a separate full-width surface-colored bar below the sticky brand/search header. `/singles` retains all existing singles filters.
- `presentation/sealed-browser.tsx` handles banners, horizontal rows, category/set results, language filtering and manual pagination. `config/sealed.ts` defines category names/slugs/colors. `application/sealed-catalogue.ts` contains pure filtering: newest creation first, Almost gone = managed stock 1–3, Deals = calculated CLP amount below Medusa original amount. Unpriced or non-CLP options cannot be added. Native variant IDs use the existing cart.
- `GET /api/sealed?q=&category=&set=&language=&collection=&offset=0` is a same-origin server projection. `adapters/sealed-directory.ts` enumerates public categories and their descendants beneath `sealed-products`, loads channel-scoped native Medusa products in batches of 100 including prices and inventory, then filters before returning pages of 24 options plus facets and preview rows. Parent queries include child-only assignments. Missing root returns empty, never all products. No demo fallback. This scans the sealed catalogue server-side per request; use indexed backend filters for larger inventories. Legacy `sealed-repository.ts`/`sealed-catalogue.tsx` are no longer used by pages.
- Medusa setup in sibling backend: `pnpm exec medusa exec ./src/scripts/configure-sealed-catalogue.ts`, then `pnpm exec medusa exec ./src/scripts/configure-sealed-tree.ts`. Second script creates child categories idempotently and categorizes the existing two demos. Publish products to the storefront channel with CLP prices and stock in a linked location. Assign a child category; also assigning the parent is optional now. Set metadata `kind=sealed`, `game=magic-the-gathering`, `set`, `set_code`; `language` may be variant/product metadata or the Language option. Sales/inventory remain per variant. Custom singles CMS unchanged.
- Banner metadata: `banner_image` = set/background image URL, `product_cutout` = transparent product PNG/WebP URL, `banner_color` = six-digit hex, `set_released_at` = ISO date. Category banners choose the newest release's relevant product; set banners derive from listed sealed products. If artwork is absent, use the product thumbnail or a clearly generic package placeholder; current demo products have placeholder art only. No hardcoded real release/artwork is invented.
- Demo stock seed: backend `pnpm exec medusa exec ./src/scripts/seed-demo-sealed.ts` creates two illustrative products without changing matching existing handles. Placeholder illustrations live in `public/demo/`.
- Checkout/payment remains disabled. Last checks: production build, frontend/backend typecheck and live category/language API succeeded. Image components retain Next image-optimization lint warnings.
- Sealed landing presentation: full-bleed set hero immediately below navigation, without the landing title/breadcrumb/language filter or external set-tab strip. Child pages retain breadcrumbs and language filters. Product categories use a horizontal tile row, tinted from theme primary/accent (packs purple, bundles amber/yellow); no category hero carousel. Home hero has only Sealed and Singles; Bulk finder remains on Singles.
- `../bannedCards-server/src/scripts/seed-wpn-sealed.ts` reproducibly seeds 34 sample sealed listings for FRA (8), MSH (10), HOB (9), SOS (7), using official WPN product names, product-shot URLs and set headers verified 2026-09-27. Keeps source URLs, release dates and credits in metadata; existing handles are skipped. Prices/stock are illustrative and marked `demo_inventory`; storefront shows “Sample price & stock”. Ambiguous multi-deck/grouped products are omitted. Official artwork stays on Wizards' CDN; no asset binary copies are bundled.
- Set hero backgrounds are slightly more visible (46% image opacity and lighter tint). `/api/sealed` supplies up to five unique product cutouts per set, prioritizing variety across boxes/bundles/precons/packs/extras; the hero displays them as a layered group, deduplicating language variants that share artwork.
- Original Demo collection placeholder products (`demo-sealed-booster-box`, `demo-sealed-commander-deck`) are unpublished via backend `remove-demo-collection.ts`; the collection is derived from published products and disappears automatically. The 34 WPN set products remain published. Original placeholders are retained as drafts, preserving records.

- Set heroes always use theme primary purple, ignoring per-set banner colors. Product cutouts form one horizontal row right of the copy/button; on narrow mobile screens the copy stacks below. Category tiles use subtle primary/muted blends, without yellow or high-saturation accents.

- Set hero content is centered within a 1200px maximum area with a 48–88px column gap and generous vertical padding. Product images cap at 140px wide / 220px high to avoid growing excessively on wide displays; the background remains full-width.
- Set hero cutouts show up to five products above 1100px, three at 601–1100px, and two at 600px or below. This only changes banner presentation; the full set catalogue remains available.
- Initial sealed loading uses `presentation/catalogue-skeleton.tsx`: full-width hero placeholders and product cards; paginated loading uses card placeholders. Cart/session startup status is screen-reader-only, avoiding a text row above the hero. Skeleton colors follow themes and animation respects reduced motion.
- Sealed hero cutouts use `banner-product-image.tsx`: individual skeletons remain until image load (including cached-image detection), then fade in. URL keys reset state on slide changes; failed images show the product name. Wrapper slots preserve responsive 5/3/2 product limits and avoid layout shifts.

- Bottom service items now link to `/sell-cards`, open the existing bulk finder dialog directly (including sealed pages), and describe the family-run Chilean shop. `/sell-cards` shows the owner-provided rate: Card Kingdom USD price × 450 = CLP offer (US$10 → CLP $4,500). Edit `config/buying-rates.ts`; no automatic Card Kingdom lookup or invented condition/cash/credit adjustments.
- Hero slides share a CSS grid row so the tallest slide determines carousel height at each viewport width. Inactive slides use visibility:hidden, aria-hidden and inert, retaining sizing without focusable hidden controls.

- Header hamburger to the right of Cart contains theme, UI language, login/profile. `locale-provider.tsx` and `config/translations.ts` provide Spanish-default/English UI; `storefront-language` and `storefront-theme` cookies persist browser preferences for one year. Product/set names stay original.
- Account registration uses native Medusa email/password auth + customer creation, then cookie session login. `account-panel.tsx` lists authenticated orders in pages of 10; checkout remains disabled. Account cart ID lives in customer metadata `storefront_cart_id`; sign-in restores it and merges guest variants, taking the larger quantity for duplicate variants to make retries safe. Cart ownership/region/completion are checked before restoration; server validates stock/prices. Preferences currently persist per browser, not across devices.
- Cart images use line-item thumbnail when product relation is absent; `CardImage` retries on image URL changes. Buttons and cart badge have 6px corners.

- Google sign-in: `adapters/google-auth.ts`, `presentation/google-button.tsx`, `/auth/google/callback`. Native backend Google provider is enabled only when GOOGLE_CLIENT_ID/SECRET/CALLBACK_URL are present. `GET /store/auth/google` exposes availability; `POST /store/auth/google/complete` creates verified Google customers or explicitly links a same-email Google identity to the authenticated customer session. Existing email/password accounts must sign in and link in Profile; email alone never merges accounts. Browser validates OAuth state/10-minute expiry and local-only return paths; JWTs remain memory-only and exchange for the normal session. Setup: root `docs/google-sign-in.md`. Real Google end-to-end verification requires owner-supplied credentials.

- Local Medusa production start uses HTTPS-only cookies by default. Backend LOCAL_HTTP_SESSION=true opts into HttpOnly/SameSite=Lax HTTP cookies with loopback-only Store/Auth CORS validation. Keep unset/false for deployments. Google callback confirms /store/customers/me before redirecting; customer state is shown independently of cart-sync success.

- Sealed landing hero displays only the five newest sets by set release date (full set facets remain available). Its first product row is Latest releases / Últimos lanzamientos, using `collection=latest-releases` sorted by set release date then product creation date; its More link keeps that order. The full grid is Newest / Novedades and remains sorted by product creation date. Home newest row and legacy `/sealed/collections/newest` retain creation-date ordering.
- Sealed directory resolves each product set code against the synced `/store/tcg/sets` directory (including family member codes) before projecting release dates. This overrides stale product release metadata and supplies dates missing on CMS imports, consistently feeding hero order, category artwork and Latest releases. Hidden/missing directory entries fall back to product `set_released_at`; undated sets sort last. Directory request failures surface the existing retry state.

- Home singles showcase now requests 20 groups in the API default descending-price order (stock filter on), labeled Featured singles / Cartas de mayor valor. It no longer uses added-date order; `/singles` still defaults to Latest added. CatalogueQuery.limit optionally controls page size (default 40).

- CMS Storefront sections screen persists boolean visibility in native store metadata (public /store/storefront-settings, protected CMS resource/action storefront_settings). Layout reads no-store settings and SectionsProvider refreshes on window focus. Defaults enabled; disabling sealed hides navigation and all Home sealed content and redirects sealed routes to Home (sealed API returns 404). Other flags control Home banner/rows, sealed landing blocks and bottom services; buy-card page is 404 when hidden. Products/inventory are untouched.

## Stores and warehouses
- Each storefront deployment uses a publishable API key linked to its own Medusa sales channel. CMS Stores & warehouses controls stock-location links; prices remain shared. Configure the domain/CORS separately.
- Browser and customer saved-cart identifiers are namespaced by publishable key. Legacy customer carts are restored only if the backend authorizes the current store; cross-store carts return 403.
