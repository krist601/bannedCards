const {test}=require('node:test');const assert=require('node:assert/strict');
const {normalizeSections,sectionDefaults}=require('../.test-build/config/storefront-sections');
test('visibility defaults preserve existing store and explicit disabled settings survive',()=>{
 assert.deepEqual(normalizeSections(undefined),sectionDefaults);
 assert.equal(normalizeSections({sealed:false,homeSingles:false}).sealed,false);
 assert.equal(normalizeSections({sealed:false,homeSingles:false}).homeSingles,false);
 assert.equal(normalizeSections({sealed:false}).homeSealed,true);
 assert.equal(normalizeSections({sealed:'false'}).sealed,true);
 assert.equal('unknown' in normalizeSections({unknown:false}),false);
});

test('singles master switch defaults on and can be disabled',()=>{assert.equal(sectionDefaults.singles,true);assert.equal(normalizeSections({singles:false}).singles,false);});
test('custom products and accessories switches default on',()=>{for(const key of ['custom','accessories','homeCustom','homeAccessories'])assert.equal(sectionDefaults[key],true);assert.equal(normalizeSections({custom:false}).custom,false);});
