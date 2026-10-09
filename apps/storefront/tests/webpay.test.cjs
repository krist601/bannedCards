const { test } = require('node:test'); const assert = require('node:assert/strict')
const { isWebpayUrl, readWebpayReturn, hasWebpayReturn } = require('../.test-build/application/webpay.js')

test('only Transbank addresses are accepted for the payment redirect', () => {
  assert.equal(isWebpayUrl('https://webpay3gint.transbank.cl/webpayserver/initTransaction'), true)
  assert.equal(isWebpayUrl('https://webpay3g.transbank.cl/webpayserver/initTransaction'), true)
  for (const bad of ['http://webpay3g.transbank.cl/x', 'https://webpay3g.transbank.cl.evil.test/x', 'https://evil.test/https://webpay3g.transbank.cl/', 'javascript:alert(1)', '']) assert.equal(isWebpayUrl(bad), false, bad)
})
test('the return address is read for the Webpay values only', () => {
  assert.deepEqual(readWebpayReturn('?token_ws=abc&x=1'), { token_ws: 'abc' })
  assert.deepEqual(readWebpayReturn(new URLSearchParams('TBK_TOKEN=t&TBK_ORDEN_COMPRA=BC9&TBK_ID_SESION=s&evil=1')), { TBK_TOKEN: 't', TBK_ORDEN_COMPRA: 'BC9', TBK_ID_SESION: 's' })
  assert.equal(hasWebpayReturn(readWebpayReturn('?token_ws=abc')), true); assert.equal(hasWebpayReturn(readWebpayReturn('?TBK_ORDEN_COMPRA=BC9')), true); assert.equal(hasWebpayReturn(readWebpayReturn('?x=1')), false)
  assert.equal(readWebpayReturn('?token_ws=' + 'a'.repeat(500)).token_ws.length, 200)
})
