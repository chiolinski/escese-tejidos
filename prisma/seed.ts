import { db } from '../lib/db'
import { hashPassword } from '../lib/auth'
import { collections } from '../lib/store'
import catalog from '../data/catalogo.json'

async function seed() {
  for (const category of collections) {
    await db.category.upsert({ where: { slug: category.slug }, create: category, update: {} })
  }
  for (const [index, item] of catalog.entries()) {
    const category = await db.category.findUniqueOrThrow({ where: { slug: item.category } })
    await db.product.upsert({
      where: { slug: item.slug }, update: {},
      create: {
        slug: item.slug, name: item.name, description: item.description, categoryId: category.id,
        materials: '', care: '', price: 0, published: true, featured: index < 3,
        images: { create: item.images.map((url, position) => ({ url, position, alt: item.name })) },
        variants: { create: { inventory: { create: { available: 0 } } } },
      },
    })
  }
  await db.storeSettings.upsert({ where: { id: 1 }, create: {}, update: {} })
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const password = process.env.ADMIN_PASSWORD
  if (email || password) {
    if (!email || !password || password.length < 14 || password.length > 128) throw new Error('Configura ADMIN_EMAIL y una contraseña de 14 a 128 caracteres.')
    await db.adminUser.upsert({
      where: { email },
      create: { email, passwordHash: hashPassword(password) },
      update: {},
    })
  }
}

seed().catch(error => {
  console.error(error instanceof Error ? error.message : 'Falló la carga inicial')
  process.exitCode = 1
}).finally(() => db.$disconnect())