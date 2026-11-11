import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { AddToCart } from '@/components/cart'
import { ProductCard } from '@/components/product-card'
import { catalogProducts } from '@/lib/catalog'
import { clp, instagram } from '@/lib/store'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = (await catalogProducts()).find(item => item.slug === slug)
  return product ? { title: product.name, description: product.description } : {}
}

export default async function Product({ params }: Props) {
  const { slug } = await params
  const products = await catalogProducts()
  const product = products.find(item => item.slug === slug)
  if (!product) notFound()
  const related = products.filter(item => item.category === product.category && item.slug !== slug).slice(0, 3)
  return <section className="shell section">
    <Link href="/tienda" className="mb-6 inline-block underline">Volver a la tienda</Link>
    <div className="grid gap-8 md:grid-cols-2">
      <div className="grid gap-4">{product.images.map((image, index) => <div key={image} className="relative aspect-square bg-[#efe8f6]"><Image src={image} alt={product.name + (index ? ' · Vista adicional' : '')} fill sizes="(min-width: 760px) 50vw, 100vw" className="object-contain" /></div>)}</div>
      <div className="space-y-5"><h1 className="text-5xl md:text-6xl">{product.name}</h1>
        {product.demo && <p>Producto de prueba</p>}
        <p>{product.description}</p>
        <p className="font-semibold">{product.price === null ? 'Precio y disponibilidad por confirmar' : clp.format(product.price)}</p>
        {product.leadTime && <p>Tiempo de confección · {product.leadTime}</p>}
        {product.materials && <p><strong>Materiales</strong> · {product.materials}</p>}
        {product.care && <p><strong>Cuidados</strong> · {product.care}</p>}
        {product.available && product.price !== null && !product.demo ? <AddToCart name={product.name} price={product.price} variants={product.variants} madeToOrder={product.madeToOrder} /> : <a href={instagram} className="button">Consultar por Instagram</a>}
      </div>
    </div>
    {related.length > 0 && <div className="mt-14"><h2 className="mb-6">Piezas relacionadas</h2><div className="cards">{related.map(item => <ProductCard key={item.slug} product={item} />)}</div></div>}
  </section>
}