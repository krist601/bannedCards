const {test}=require('node:test');const assert=require('node:assert/strict');
const {lineAvailability,purchasableQuantity,cartItemCount,cartTotal,cartHasUnavailable}=require('../.test-build/application/cart');
const line=(id,price,quantity,stock)=>({id,price,quantity,stock});
test('a line is out when no stock is left and short when stock is below the wanted quantity',()=>{
 assert.equal(lineAvailability(line('a',100,2,null)),'ok');
 assert.equal(lineAvailability(line('a',100,2,5)),'ok');
 assert.equal(lineAvailability(line('a',100,2,2)),'ok');
 assert.equal(lineAvailability(line('a',100,3,2)),'short');
 assert.equal(lineAvailability(line('a',100,1,0)),'out');
 assert.equal(lineAvailability(line('a',100,1,-1)),'out');
});
test('unavailable quantities are not counted in the item count or the subtotal',()=>{
 const cart=[line('ok',1000,2,10),line('out',5000,1,0),line('short',300,4,2),line('unknown',50,3,null)];
 assert.equal(purchasableQuantity(cart[1]),0);assert.equal(purchasableQuantity(cart[2]),2);
 assert.equal(cartItemCount(cart),2+0+2+3);
 assert.equal(cartTotal(cart),2*1000+0+2*300+3*50);
 assert.equal(cartHasUnavailable(cart),true);
 assert.equal(cartHasUnavailable([cart[0],cart[3]]),false);
});
