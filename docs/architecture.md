# Architecture

Banned Cards uses a pragmatic hexagonal architecture. The storefront can change from demo data to Medusa without changing its business rules or presentation components.

```text
Next.js page (driving adapter)
  -> application cart use cases
  -> domain commerce types
  -> repository ports
       -> browser local storage (current adapter)
       -> Medusa Store API (production adapter)

Medusa catalog module (driving adapter for administration)
  -> generic Game / Product / Listing records
  -> card-specific Printing / CardListing records when a product is a single
```

## Core concepts

- **Game** identifies Magic, Pokémon, One Piece, or another game.
- **Product** is a generic sellable concept with kind `single`, `sealed`, or `accessory`.
- **Listing** represents a purchasable inventory record, including price and quantity.
- Card-only data such as collector number, rarity, and finish belongs in optional attributes or the printing records.

## Migration path

1. `demoCatalogueRepository` is the temporary catalog adapter.
2. Implement a `medusaCatalogueRepository` that satisfies `CatalogueRepository`.
3. Replace browser cart and customer adapters with Medusa Store API adapters.
4. Add a Mercado Pago payment adapter behind a payment port.

The application and domain layers must not import Next.js, Medusa, PostgreSQL, or Mercado Pago.
