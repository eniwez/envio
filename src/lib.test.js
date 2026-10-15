import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatRut, isPhone, isRut, sizeFromMeasures } from './lib.js'

test('rut', () => {
  assert.ok(isRut('12.345.678-5'))
  assert.ok(isRut('11111111-1'))
  assert.ok(!isRut('12345678-9'))
  assert.equal(formatRut('123456785'), '12345678-5')
})

test('celular', () => {
  assert.ok(isPhone('912345678'))
  assert.ok(isPhone('56912345678'))
  assert.ok(!isPhone('212345678'))
})

test('talla desde medidas', () => {
  const sizes = [
    { code: 'XS', maxKg: 0.5, dims: [25, 20, 5] },
    { code: 'S', maxKg: 3, dims: [20, 20, 30] },
    { code: 'M', maxKg: 6, dims: [30, 30, 25] },
  ]
  assert.equal(sizeFromMeasures(sizes, { length: 20, width: 15, height: 4, weight: 0.3 }), 'XS')
  assert.equal(sizeFromMeasures(sizes, { length: 28, width: 18, height: 18, weight: 2 }), 'S')
  assert.equal(sizeFromMeasures(sizes, { length: 30, width: 30, height: 20, weight: 5 }), 'M')
  assert.equal(sizeFromMeasures(sizes, { length: 90, width: 30, height: 20, weight: 1 }), 'TOO_BIG')
  assert.equal(sizeFromMeasures(sizes, { length: 10, width: 10, height: 10, weight: '' }), null)
})
