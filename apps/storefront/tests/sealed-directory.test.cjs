const {test}=require('node:test');const assert=require('node:assert/strict');
const {loadSealedDirectory}=require('../.test-build/adapters/sealed-directory');
const {selectSealed}=require('../.test-build/application/sealed-catalogue');
test('imported products use synced set release dates rather than import order or stale metadata',async()=>{
 const previous=global.fetch;
 const product=(id,code,created)=>({id,title:id,created_at:created,metadata:{set:code,set_code:code,set_released_at:'2000-01-01'},variants:[{id:`${id}-variant`,calculated_price:{currency_code:'clp',calculated_amount:1000}}]});
 global.fetch=async url=>({ok:true,json:async()=>{
  const path=String(url);
  if(path.includes('product-categories'))return {count:1,product_categories:[{id:'root',handle:'sealed-products'}]};
  if(path.includes('/tcg/sets')){
   const code=new URL(path,'http://localhost').searchParams.get('q');
   return {sets:[{code,setCodes:[code],releasedAt:code==='new'?'2026-09-01':'2026-01-01'}],nextOffset:null};
  }
  return {count:2,products:[product('recent-import','OLD','2026-09-30'),product('new-release','NEW','2026-01-01')]};
 }});
 try {
  const items=await loadSealedDirectory(new AbortController().signal);
  assert.equal(items[0].attributes.releasedAt,'2026-01-01');
  assert.equal(items[1].attributes.releasedAt,'2026-09-01');
  assert.equal(selectSealed(items,{collection:'latest-releases'})[0].name,'new-release');
  assert.equal(selectSealed(items,{collection:'newest'})[0].name,'recent-import');
 }finally{global.fetch=previous;}
});
test('sealed directory queries descendants, excludes unrelated categories and maps language plus discount attributes',async()=>{
 const previous=global.fetch;let productRequest;
 global.fetch=async url=>({ok:true,json:async()=>{
  if(String(url).includes('/tcg/sets'))return {sets:[{code:'exm',setCodes:['exm'],releasedAt:'2026-04-01'}],nextOffset:null};
  if(String(url).includes('product-categories'))return {count:4,product_categories:[{id:'root',handle:'sealed-products'},{id:'packs',handle:'sealed-booster-packs',parent_category_id:'root'},{id:'play',handle:'play-boosters',parent_category_id:'packs'},{id:'other',handle:'accessories'}]};
  productRequest=new URL(String(url),'http://localhost');
  return {count:1,products:[{id:'product',title:'Play booster',created_at:'2026-09-01',metadata:{set:'Example',set_code:'EXM'},categories:[{id:'play',handle:'play-boosters'}],variants:[{id:'variant',manage_inventory:true,inventory_quantity:2,options:[{value:'Spanish',option:{title:'Language'}}],calculated_price:{currency_code:'clp',calculated_amount:4000,original_amount:5000}}]}]};
 }});
 try {const items=await loadSealedDirectory(new AbortController().signal);assert.equal(items.length,1);assert.equal(items[0].attributes.language,'Spanish');assert.equal(items[0].attributes.originalPrice,'5000');assert.ok(items[0].attributes.categoryPaths.split(',').includes('booster-packs'));assert.equal(items[0].attributes.setSlug,'exm');assert.equal(productRequest.searchParams.get('category_id[2]'),'play');assert.equal(productRequest.searchParams.get('category_id[3]'),null);}finally{global.fetch=previous;}
});
