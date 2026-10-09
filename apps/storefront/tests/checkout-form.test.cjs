const { test } = require('node:test'); const assert = require('node:assert/strict')
const { isValidRut, formatRut } = require('../.test-build/application/rut.js')
const { emptyCheckoutForm, validateCheckoutForm, toCheckoutContact } = require('../.test-build/application/checkout-form.js')
const { regions, metropolitanComunas } = require('../.test-build/config/chile.js')

const filled = { ...emptyCheckoutForm, name: 'Ana', lastName: 'Soto', phone: '+56 9 6139 9997', address: 'Av. 1', region: 'Región Metropolitana de Santiago', city: 'Las Condes', rut: '12.345.678-5' }

test('RUT: valid numbers pass, wrong check digits fail, typing is formatted', () => {
  assert.equal(isValidRut('12.345.678-5'), true); assert.equal(isValidRut('12345678-5'), true); assert.equal(isValidRut('10000013k'), true)
  assert.equal(isValidRut('12.345.678-9'), false); assert.equal(isValidRut('1'), false); assert.equal(isValidRut(''), false)
  assert.equal(formatRut('123456785'), '12.345.678-5'); assert.equal(formatRut('1'), '1'); assert.equal(formatRut('12.345.678-5'), '12.345.678-5')
})
test('the boleta form needs delivery data, a phone and a valid RUT', () => {
  assert.deepEqual(validateCheckoutForm(filled), {})
  const empty = validateCheckoutForm(emptyCheckoutForm)
  for (const key of ['name', 'lastName', 'address', 'region', 'city', 'phone', 'rut']) assert.equal(empty[key], 'required', key)
  assert.equal(validateCheckoutForm({ ...filled, rut: '12.345.678-9' }).rut, 'rut')
  assert.equal(validateCheckoutForm({ ...filled, phone: '123' }).phone, 'phone')
  assert.equal(empty.companyName, undefined)
})
test('the factura form needs the company data instead of a personal RUT', () => {
  const factura = { ...filled, document: 'factura', rut: '' }
  const errors = validateCheckoutForm(factura)
  for (const key of ['companyRut', 'companyName', 'companyActivity', 'companyAddress', 'companyComuna']) assert.equal(errors[key], 'required', key)
  assert.equal(errors.rut, undefined)
  const complete = { ...factura, companyRut: '76.086.428-5', companyName: 'Mi Empresa SpA', companyActivity: 'Juegos', companyAddress: 'Calle 1', companyComuna: 'Providencia' }
  assert.deepEqual(validateCheckoutForm(complete), {}); assert.equal(validateCheckoutForm({ ...complete, companyRut: '76.086.428-0' }).companyRut, 'rut')
})
test('the contact sent to the store is trimmed and typed', () => {
  const boleta = toCheckoutContact({ ...filled, name: ' Ana ', address2: '', branch: '  ', notes: ' hola ', rut: '123456785' })
  assert.deepEqual(boleta, { name: 'Ana', lastName: 'Soto', phone: '+56 9 6139 9997', address: 'Av. 1', address2: undefined, city: 'Las Condes', region: 'Región Metropolitana de Santiago', branch: undefined, notes: 'hola', shipping: 'starken', document: 'boleta', rut: '12.345.678-5' })
  const factura = toCheckoutContact({ ...filled, document: 'factura', companyRut: '760864285', companyName: 'X SpA', companyActivity: 'Y', companyAddress: 'Z', companyComuna: 'W' })
  assert.deepEqual(factura.company, { rut: '76.086.428-5', name: 'X SpA', activity: 'Y', address: 'Z', comuna: 'W' }); assert.equal(factura.rut, undefined)
})
test('the Chilean location lists are complete', () => { assert.equal(regions.length, 16); assert.equal(metropolitanComunas.length, 52); assert.ok(regions.includes('Región Metropolitana de Santiago')) })
