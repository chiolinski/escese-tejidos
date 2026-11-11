import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const url = process.env.APP_URL
  return { rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/api', '/pago', '/checkout', '/carrito'] },
    sitemap: url ? new URL('/sitemap.xml', url).href : undefined }
}