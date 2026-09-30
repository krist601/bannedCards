const { test } = require('node:test');
const assert = require('node:assert/strict');
const { filterCatalogue } = require('../.test-build/application/filter-catalogue.js');
const cards = [
 { id:'a', name:'Alpha', set:'Same title', setCode:'abc', price:10, stock:1 },
 { id:'b', name:'Beta', set:'Same title', setCode:'xyz', price:20, stock:1 },
 { id:'c', name:'Gamma', set:'Same title', setCode:'abc', price:30, stock:0 },
];
test('exact set codes separate equal set names; latest uses API codes',()=>{
 assert.deepEqual(filterCatalogue(cards,'',{kind:'set',code:'abc'},[],[]).map(c=>c.id),['a','c']);
 assert.deepEqual(filterCatalogue(cards,'',{kind:'latest'},['xyz'],[]).map(c=>c.id),['b']);
 assert.deepEqual(filterCatalogue(cards,'beta',{kind:'all'},[],[]).map(c=>c.id),['b']);
});
test('hottest preserves sales order rather than price order and does not invent rankings',()=>{
 assert.deepEqual(filterCatalogue(cards,'',{kind:'hottest'},[],['a','b']).map(c=>c.id),['a','b']);
 assert.deepEqual(filterCatalogue(cards,'',{kind:'hottest'},[],[]),[]);
});

test('family selection includes all API-provided member codes',()=>{
 assert.deepEqual(filterCatalogue(cards,'',{kind:'set',code:'abc',setCodes:['abc','xyz']},[],[]).map(c=>c.id),['b','a','c']);
});
