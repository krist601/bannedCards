const { test } = require('node:test');
const assert = require('node:assert/strict');
const { groupCards } = require('../.test-build/application/group-cards.js');
const base = {id:'nm',kind:'single',game:'magic-the-gathering',name:'Example',set:'Example Set',setCode:'abc',finish:'Non-foil',condition:'Near Mint',imageUrl:'/art.jpg',price:20,stock:2,attributes:{printingId:'printing',collectorNumber:'12',language:'en'}};
test('condition variants group while retaining exact stock, price and variant identity',()=>{
 const lp={...base,id:'lp',condition:'Lightly Played',price:10,stock:3};
 const groups=groupCards([base,lp]);
 assert.equal(groups.length,1);assert.deepEqual(groups[0].cards,[base,lp]);
});
test('different printing details, language and art stay separate',()=>{
 for(const change of [{name:'Other'},{setCode:'xyz'},{imageUrl:'/other.jpg'},{attributes:{...base.attributes,collectorNumber:'13'}},{attributes:{...base.attributes,printingId:'other'}},{attributes:{...base.attributes,language:'es'}}]){
  assert.equal(groupCards([base,{...base,...change,id:'lp',condition:'LP'}]).length,2);
 }
});
test('missing identity and duplicate condition listings are not silently merged',()=>{
 assert.equal(groupCards([base,{...base,id:'nm2'}]).length,2);
 assert.equal(groupCards([{...base,attributes:undefined},{...base,id:'lp',attributes:undefined,condition:'LP'}]).length,2);
});

test('finishes share one card while keeping their own condition variants',()=>{
 const foil={...base,id:'foil',finish:'Foil'};
 const lp={...foil,id:'foil-lp',condition:'LP'};
 assert.deepEqual(groupCards([base,foil,lp])[0].cards,[base,foil,lp]);
 assert.equal(groupCards([base,foil,lp]).length,1);
});
