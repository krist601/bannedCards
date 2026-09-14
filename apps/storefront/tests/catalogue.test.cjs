const { test } = require("node:test");
const assert = require("node:assert/strict");
const { isOutOfStock, orderCatalogue } = require("../.test-build/application/catalogue.js");

function item(id, price, stock) {
  return { id, name: id, price, stock };
}

test("available cards sort from most expensive to cheapest and sold-out cards come last", () => {
  const original = [
    item("sold-expensive", 100000, 0),
    item("available-cheap", 5000, 2),
    item("available-unlimited", 12000, null),
    item("available-expensive", 25000, 1),
    item("sold-cheap", 1000, 0)
  ];

  const ordered = orderCatalogue(original);

  assert.deepEqual(ordered.map(card => card.id), [
    "available-expensive",
    "available-unlimited",
    "available-cheap",
    "sold-expensive",
    "sold-cheap"
  ]);
  assert.deepEqual(original.map(card => card.id), [
    "sold-expensive",
    "available-cheap",
    "available-unlimited",
    "available-expensive",
    "sold-cheap"
  ]);
});

test("only an explicit zero stock count is sold out", () => {
  assert.equal(isOutOfStock(item("zero", 1, 0)), true);
  assert.equal(isOutOfStock(item("available", 1, 1)), false);
  assert.equal(isOutOfStock(item("unmanaged", 1, null)), false);
});

test("cards without a price follow priced cards inside the sold-out group", () => {
  const ordered = orderCatalogue([
    item("unlisted", null, 0),
    item("listed-sold", 7000, 0),
    item("available", 1000, 1)
  ]);
  assert.deepEqual(ordered.map(card => card.id), ["available", "listed-sold", "unlisted"]);
});
