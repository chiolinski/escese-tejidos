import { existsSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import catalog from '../data/catalogo.json'
import { collections } from '../lib/store'

test('el catálogo referencia las quince fotos entregadas y usa URL únicas', () => {
  assert.equal(new Set(catalog.map(item => item.slug)).size, catalog.length)
  const images = catalog.flatMap(item => item.images)
  assert.equal(new Set(images).size, 15)
  for (const image of images) assert.ok(existsSync('public' + image), image)
  for (const item of catalog) assert.ok(collections.some(category => category.slug === item.category))
})