import type { MetadataRoute } from 'next'
import { catalogProducts } from '@/lib/catalog'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const url = process.env.APP_URL
  if (!url) return []
  const products = await catalogProducts()
  return ['/', '/tienda', ...products.filter(product => !product.demo).map(product => '/productos/' + product.slug)]
    .map(path => ({ url: new URL(path, url).href }))
}