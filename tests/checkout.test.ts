import { test } from 'node:test'
import assert from 'node:assert/strict'
import { checkoutSchema } from '../lib/checkout-schema'
import { hashPassword, verifyPassword } from '../lib/auth'

const valid = {
  name: 'Comprador de prueba', email: 'pruebas@example.com', phone: '+56912345678',
  pickup: false, region: 'Ñuble', comuna: 'Quirihue', address: 'Dirección de prueba', notes: '',
  items: [{ variantId: 'variante-1', quantity: 1 }],
}

test('el checkout valida entrega, cantidad y variantes', () => {
  assert.ok(checkoutSchema.safeParse(valid).success)
  assert.ok(checkoutSchema.safeParse({ ...valid, pickup: true, address: '' }).success)
  assert.ok(!checkoutSchema.safeParse({ ...valid, address: '' }).success)
  assert.ok(!checkoutSchema.safeParse({ ...valid, items: [{ variantId: 'variante-1', quantity: 0 }] }).success)
  assert.ok(!checkoutSchema.safeParse({ ...valid, items: [...valid.items, ...valid.items] }).success)
})

test('las contraseñas se verifican con una sal individual', () => {
  const password = 'solo-para-pruebas-locales'
  const hash = hashPassword(password)
  assert.notEqual(hash, hashPassword(password))
  assert.ok(verifyPassword(password, hash))
  assert.ok(!verifyPassword('incorrecta', hash))
  assert.ok(!verifyPassword(password, 'entrada-invalida'))
})