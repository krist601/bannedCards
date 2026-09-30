const {test}=require('node:test');const assert=require('node:assert/strict');
const {selectSealed}=require('../.test-build/application/sealed-catalogue');
const items=[
{id:'a',name:'Box',set:'Alpha',price:100,stock:2,attributes:{language:'English',categoryPaths:'products,booster-boxes',setSlug:'alpha',addedAt:'2026-01-02',originalPrice:'120'}},
{id:'b',name:'Pack',set:'Beta',price:20,stock:0,attributes:{language:'Spanish',categoryPaths:'products,booster-packs',setSlug:'beta',addedAt:'2026-01-03',originalPrice:'20'}},
{id:'c',name:'Bundle',set:'Alpha',price:200,stock:null,attributes:{language:'English',categoryPaths:'products,bundles',setSlug:'alpha',addedAt:'2026-01-01'}},
];
test('sealed root includes all children; category, set and language are independent filters',()=>{
assert.deepEqual(selectSealed(items,{}).map(i=>i.id),['b','a','c']);
assert.deepEqual(selectSealed(items,{category:'booster-boxes'}).map(i=>i.id),['a']);
assert.deepEqual(selectSealed(items,{set:'alpha',language:'Spanish'}),[]);
assert.equal(selectSealed(items,{set:'alpha',language:'English'}).length,2);
});
test('almost gone excludes sold-out and unmanaged stock; deals require a real lower price',()=>{
assert.deepEqual(selectSealed(items,{collection:'almost-gone'}).map(i=>i.id),['a']);
assert.deepEqual(selectSealed(items,{collection:'deals'}).map(i=>i.id),['a']);
});
test('latest releases sorts by set release, while novedades keeps creation order',()=>{
const catalogue=[
 {...items[0],attributes:{...items[0].attributes,releasedAt:'2026-11-01',addedAt:'2026-01-01'}},
 {...items[1],attributes:{...items[1].attributes,releasedAt:'2026-03-01',addedAt:'2026-09-01'}},
 {...items[2],attributes:{...items[2].attributes,releasedAt:'2026-11-01',addedAt:'2026-01-02'}},
 {...items[0],id:'undated',attributes:{addedAt:'2026-10-01'}},
];
assert.deepEqual(selectSealed(catalogue,{collection:'latest-releases'}).map(i=>i.id),['c','a','b','undated']);
assert.deepEqual(selectSealed(catalogue,{}).map(i=>i.id),['undated','b','c','a']);
assert.deepEqual(selectSealed(catalogue,{collection:'newest'}).map(i=>i.id),['undated','b','c','a']);
});
