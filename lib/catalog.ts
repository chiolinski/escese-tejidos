import { cache } from 'react'
import { db } from './db'
import { collections } from './store'
import catalog from '@/data/catalogo.json'

export const referenceProducts = catalog.map(product => ({
  ...product,
  price: null as number | null,
  available: false,
  madeToOrder: false,
  demo: false,
  featured: ['cuello-morado', 'cuello-jaspeado-rosa', 'cuello-jaspeado-violeta'].includes(product.slug),
  leadTime: null as string | null,
  materials: '',
  care: '',
  variants: [] as { id: string; color: string; size: string; inventory: { available: number } | null }[],
}))

export const catalogProducts = cache(async () => {
  if (!process.env.DATABASE_URL) return referenceProducts
  const products = await db.product.findMany({
    where: { published: true },
    orderBy: { createdAt: 'desc' },
    include: { category: true, images: { orderBy: { position: 'asc' } }, variants: { include: { inventory: true } } },
  })
  return products.map(product => ({
    ...product,
    price: product.price > 0 ? product.price : null,
    category: product.category.slug,
    images: product.images.map(image => image.url),
    available: product.madeToOrder || product.variants.some(variant => (variant.inventory?.available ?? 0) > 0),
  }))
})
export const catalogCategories = cache(async () => process.env.DATABASE_URL
  ? db.category.findMany({ select: { slug: true, name: true }, orderBy: { name: 'asc' } })
  : collections)

export const storeSettings = cache(async () => process.env.DATABASE_URL
  ? db.storeSettings.findUnique({ where: { id: 1 } })
  : null)