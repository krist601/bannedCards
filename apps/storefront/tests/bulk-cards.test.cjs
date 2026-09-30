const {test}=require('node:test');const assert=require('node:assert/strict');
const {parseBulkList,bulkCandidates,planBulk}=require('../.test-build/application/bulk-cards.js');
const card=(id,price=10,stock=4)=>({id,name:'The One Ring',setCode:'ltr',finish:'Non-foil',condition:'Near Mint',price,stock});
test('parses quantity variants, foil markers, set codes and the LOR alias',()=>{
 const rows=parseBulkList('1x the one ring\n1 the one ring F\n4x the one ring (LOR)\n2 The One Ring (LTR) F\n2 The One Ring F (LTR)');
 assert.deepEqual(rows.map(r=>r.quantity),[1,1,4,2,2]);assert.deepEqual(rows.map(r=>r.foil),[false,true,false,true,true]);
 assert.equal(rows[2].setCode,'ltr');assert.ok(rows[2].note);assert.equal(rows[4].name,'The One Ring');
 assert.ok(parseBulkList('0x card\n-1 card\n1000 card\nwrong\n1 (ABC)').every(r=>r.error));
});
test('matches exact names and explicit finish/set; excludes unpriced/out-of-stock rows',()=>{
 const request=parseBulkList('1 the one ring (LTR)')[0];
 const cards=[card('a'),{...card('b'),name:'The One Ring Extended'}, {...card('c'),finish:'Foil'}, {...card('d'),setCode:'other'},card('empty',10,0),card('unpriced',null)];
 assert.deepEqual(bulkCandidates(request,cards).map(c=>c.id),['a']);
 assert.deepEqual(bulkCandidates({...request,foil:true},cards).map(c=>c.id),['c']);
});
test('allocates cheapest copies, accounts for cart and repeated lines, reports shortages',()=>{
 const candidates=[card('cheap',10,3),card('expensive',20,4)];
 const matches=parseBulkList('3 the one ring\n4 the one ring').map(request=>({request,candidates}));
 const plan=planBulk(matches,[{...candidates[0],quantity:1}]);
 assert.deepEqual(plan[0].allocations.map(e=>[e.card.id,e.quantity]),[['cheap',2],['expensive',1]]);
 assert.deepEqual(plan[1].allocations.map(e=>[e.card.id,e.quantity]),[['expensive',3]]);assert.equal(plan[1].missing,1);
 const chosen=planBulk([{...matches[0],selectedId:'expensive'}],[]);assert.equal(chosen[0].allocations[0].card.id,'expensive');
});
