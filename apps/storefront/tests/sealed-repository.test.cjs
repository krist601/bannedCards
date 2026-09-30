const { test } = require('node:test');
const assert = require('node:assert/strict');
const { loadSealedPage } = require('../.test-build/adapters/sealed-repository');
test('sealed catalogue filters on the server, preserves variants, CLP prices and inventory', async () => {
  const original = global.fetch;
  const requests = [];
  global.fetch = async url => {
    requests.push(String(url));
    return {ok:true,json:async()=>requests.length===1?{product_categories:[{id:'cat_sealed'}]}:{count:25,products:[{
      id:'prod_box',title:'Booster box',metadata:{set:'Example'},variants:[
        {id:'en',title:'English',manage_inventory:true,inventory_quantity:3,calculated_price:{currency_code:'clp',calculated_amount:120000}},
        {id:'es',title:'Spanish',manage_inventory:true,inventory_quantity:0,calculated_price:{currency_code:'usd',calculated_amount:100}},
        {id:'unpriced',title:'Default variant',manage_inventory:false}
      ]
    }]}};
  };
  try {
    const page = await loadSealedPage('box',0,new AbortController().signal);
    assert.equal(page.nextOffset,24);
    assert.deepEqual(page.items.map(item=>[item.id,item.kind,item.price,item.stock]),[['en','sealed',120000,3],['es','sealed',null,0],['unpriced','sealed',null,null]]);
    assert.equal(page.items[0].name,'Booster box — English');
    const params = new URL(requests[1],'http://localhost').searchParams;
    assert.equal(params.get('category_id[0]'),'cat_sealed');
    assert.equal(params.get('q'),'box');
  } finally {global.fetch=original;}
});
test('missing sealed category is an empty catalogue, never a fallback to all products', async () => {
  const original=global.fetch;let calls=0;
  global.fetch=async()=>{calls++;return {ok:true,json:async()=>({product_categories:[]})};};
  try {const page=await loadSealedPage('',0,new AbortController().signal);assert.deepEqual(page.items,[]);assert.equal(calls,1);assert.equal(page.nextOffset,null);}
  finally {global.fetch=original;}
});
