const {test}=require('node:test');
const assert=require('node:assert/strict');
const {safeReturnPath,validateGoogleReturn}=require('../.test-build/adapters/google-auth.js');
const now=1000000;
const pending=JSON.stringify({state:'expected-state',createdAt:now-1000,returnTo:'/sealed?language=English',link:true});
test('Google callback requires matching browser state, a code and an unexpired attempt',()=>{
 assert.equal(validateGoogleReturn(new URLSearchParams('code=ok&state=expected-state'),pending,now).link,true);
 for(const [query,raw,time] of [['code=ok&state=other',pending,now],['code=ok&state=expected-state',null,now],['state=expected-state',pending,now],['code=ok&state=expected-state',pending,now+600001]])assert.throws(()=>validateGoogleReturn(new URLSearchParams(query),raw,time));
});
test('cancelled Google flow fails without completing authentication',()=>{
 assert.throws(()=>validateGoogleReturn(new URLSearchParams('error=access_denied&state=expected-state'),pending,now),/cancelled/);
});
test('Google callback can only return to a local storefront page',()=>{
 for(const path of ['https://evil.test','//evil.test','/\\evil.test','/auth/google/callback','/\n/evil.test'])assert.equal(safeReturnPath(path),'/');
 assert.equal(safeReturnPath('/sealed?language=English'),'/sealed?language=English');
});
