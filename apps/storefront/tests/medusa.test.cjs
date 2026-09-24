const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createMedusaRepositories } = require('../.test-build/adapters/medusa-repositories.js');
const config = { url: 'http://medusa.test', publishableKey: 'pk_test', regionId: 'reg_cl' };
const variant = { id: 'variant_1', manage_inventory: true, inventory_quantity: 2, calculated_price: { currency_code: 'clp', calculated_amount: 15990 } };
const product = { id: 'prod_1', title: 'The One Ring', thumbnail: 'https://images.example/card.jpg', metadata: { collection: 'Middle-earth', game: 'magic-the-gathering' }, variants: [variant] };
const cart = { id: 'cart_1', region_id: 'reg_cl', currency_code: 'clp', items: [{ id: 'line_1', variant_id: variant.id, title: product.title, quantity: 1, unit_price: 12000 }] };
function setup(handler) {
  const values = new Map();
  const calls = [];
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
  const repositories = createMedusaRepositories(config, storage, async (url, init) => {
    calls.push({ url, ...init });
    assert.equal(init.headers['x-publishable-api-key'], 'pk_test');
    assert.equal(init.credentials, 'include');
    const result = await handler(new URL(url), init, calls);
    return new Response(JSON.stringify(result.body ?? result), { status: result.status ?? 200 });
  });
  return { ...repositories, values, calls };
}
test('catalog paginates custom card printings and keeps unlisted cards visible', async () => {
  const listed = {
    id: variant.id, printing_id: 'printing_1', listing_id: 'listing_1', variant_id: variant.id,
    name: 'The One Ring', set: 'The Lord of the Rings: Tales of Middle-earth', set_code: 'ltr',
    collector_number: '246', rarity: 'mythic', condition: 'Near Mint', language: 'en', finish: 'Non-foil',
    price_clp: 15990, stock: 2, image_url: 'https://images.example/card.jpg', image_small_url: null,
    colors: '', collection: 'Middle-earth', external_id: 'scryfall_1'
  };
  const unlisted = {
    ...listed, id: 'printing:printing_2', printing_id: 'printing_2', listing_id: null, variant_id: null,
    name: 'A Card Without A Listing', collector_number: '1', condition: 'Not listed', price_clp: null,
    stock: 0, image_url: null, image_small_url: 'https://images.example/card-small.jpg'
  };
  const repo = setup(url => url.searchParams.get('offset') === '0'
    ? { cards: [listed], count: 101, limit: 100 }
    : { cards: [unlisted], count: 101, limit: 100 });
  const items = await repo.catalogue.list();
  assert.equal(items.length, 2); assert.equal(items[0].price, 15990);
  assert.equal(items[0].id, variant.id); assert.equal(items[0].collection, 'Middle-earth');
  assert.equal(items[0].imageUrl, product.thumbnail);
  assert.equal(items[1].price, null); assert.equal(items[1].stock, 0);
  assert.equal(items[1].imageUrl, 'https://images.example/card-small.jpg');
  assert.equal(repo.calls.length, 2);
  assert.equal(new URL(repo.calls[1].url).searchParams.get('offset'), '100');
});
test('concurrent adds create only one cart and trust server prices', async () => {
  const repo = setup(() => ({ cart }));
  const results = await Promise.all([repo.cart.add({ id: variant.id, price: 1 }), repo.cart.add({ id: variant.id, price: 1 })]);
  assert.equal(repo.calls.filter(c => c.url.endsWith('/store/carts') && c.method === 'POST').length, 1);
  assert.equal(results[0][0].price, 12000);
  assert.deepEqual(JSON.parse(repo.calls.find(c => c.url.endsWith('/line-items')).body), { variant_id: variant.id, quantity: 1 });
  assert.deepEqual([...repo.values.values()], ['cart_1']);
});
test('updates use line IDs; zero deletes and reloads; invalid quantity makes no request', async () => {
  const repo = setup((url, init) => ({ cart: init.method === 'DELETE' ? { ...cart, items: [] } : cart }));
  await repo.cart.add({ id: variant.id });
  await repo.cart.setQuantity('line_1', 2);
  await repo.cart.setQuantity('line_1', 0);
  assert.ok(repo.calls.some(c => c.url.endsWith('/line-items/line_1') && c.method === 'POST' && JSON.parse(c.body).quantity === 2));
  assert.ok(repo.calls.some(c => c.url.endsWith('/line-items/line_1') && c.method === 'DELETE'));
  const count = repo.calls.length;
  await assert.rejects(repo.cart.setQuantity('line_1', 1.5)); assert.equal(repo.calls.length, count);
});
test('stale cart resets on 404 but network/server failures preserve its ID', async () => {
  let status = 404;
  const repo = setup(() => ({ status, body: {} }));
  const key = `banned-cards-medusa-cart:${config.url}:${config.regionId}`;
  repo.values.set(key, 'stale'); assert.deepEqual(await repo.cart.load(), []); assert.equal(repo.values.size, 0);
  repo.values.set(key, 'keep'); status = 500;
  await assert.rejects(repo.cart.load()); assert.equal(repo.values.get(key), 'keep');
});
test('authentication exchanges JWT for a session and never stores credentials', async () => {
  const repo = setup(url => url.pathname === '/auth/customer/emailpass' ? { token: 'ephemeral' } : url.pathname === '/store/customers/me' ? { customer: { email: 'customer@test.cl' } } : {});
  assert.equal(await repo.customer.login('customer@test.cl', 'password'), 'customer@test.cl');
  assert.equal(repo.calls[1].headers.Authorization, 'Bearer ephemeral');
  assert.equal(repo.calls[2].headers.Authorization, undefined); assert.equal(repo.values.size, 0);
  await repo.customer.clear(); assert.equal(repo.calls.at(-1).method, 'DELETE');
});
test('only 401 means no session; backend failures remain visible', async () => {
  const guest = setup(() => ({ status: 401, body: {} })); assert.equal(await guest.customer.load(), '');
  const broken = setup(() => ({ status: 500, body: {} })); await assert.rejects(broken.customer.load());
});
test('a non-CLP cart is rejected instead of mislabeled as pesos', async () => {
  const repo = setup(() => ({ cart: { ...cart, currency_code: 'usd' } }));
  await assert.rejects(repo.cart.add({ id: variant.id }), /CLP/);
});
test('bulk add sends the requested quantity once and rejects invalid quantities before requests',async()=>{
 const repo=setup(()=>({cart:{...cart,items:[{...cart.items[0],quantity:4}]}}));
 const result=await repo.cart.add({id:variant.id},4);
 const writes=repo.calls.filter(call=>call.url.endsWith('/line-items'));
 assert.equal(writes.length,1);assert.deepEqual(JSON.parse(writes[0].body),{variant_id:variant.id,quantity:4});assert.equal(result[0].quantity,4);
 const count=repo.calls.length;await assert.rejects(repo.cart.add({id:variant.id},0));await assert.rejects(repo.cart.add({id:variant.id},1.5));assert.equal(repo.calls.length,count);
});
