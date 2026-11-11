import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ProductCard } from '@/components/product-card'
import { catalogProducts } from '@/lib/catalog'
import { collections } from '@/lib/store'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const products = await catalogProducts()
  const featured = products.filter(product => product.featured)
  return <>
    <section className="shell hero">
      <div className="space-y-6">
        <p className="eyebrow">Tejido a mano en Quirihue, Chile</p>
        <h1>Cada puntada cuenta <em>una historia.</em></h1>
        <p className="max-w-md text-lg">Tejidos hechos a mano con dedicación, creatividad y amor por los pequeños detalles. Piezas únicas creadas en Quirihue, Chile.</p>
        <div className="flex flex-wrap items-center gap-4"><Link className="button" href="/tienda">Explorar colección <ArrowRight size={18} aria-hidden /></Link><Link className="underline" href="#historia">Descubre nuestra historia</Link></div>
      </div>
      <div className="hero-image"><Image src="/productos/tejido-03.jpeg" alt="Cuello morado tejido a mano" fill preload className="object-cover" sizes="(min-width: 760px) 50vw, 100vw" /></div>
    </section>
    <section className="border-y border-[#e8ddec] bg-[#efe8f6] py-4">
      <nav className="shell flex flex-wrap justify-center gap-x-8 gap-y-3" aria-label="Colecciones">{collections.map(category => <Link key={category.slug} className="py-2" href={'/tienda?categoria=' + category.slug}>{category.name}</Link>)}</nav>
    </section>
    <section className="shell section">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4"><h2>Piezas de la colección</h2><Link href="/tienda" className="underline">Ver toda la tienda</Link></div>
      <div className="cards">{(featured.length ? featured : products).slice(0, 3).map(product => <ProductCard key={product.slug} product={product} />)}</div>
    </section>
    <section id="historia" className="section scroll-mt-28 bg-[#efe8f6]"><div className="shell grid gap-8 md:grid-cols-2">
      <h2>Nuestra historia</h2><p className="max-w-lg text-lg">Escese Tejidos nació en Quirihue. Su creadora, terapeuta ocupacional de profesión, encontró en el tejido un espacio para desarrollar su creatividad fuera del trabajo. Con el tiempo, ese pasatiempo se convirtió en una tienda artesanal.</p>
    </div></section>
    <section className="shell section"><h2 className="mb-8">Del hilo a la pieza</h2><div className="grid gap-6 sm:grid-cols-3"><div><h3>Inspiración</h3><p>Los colores y las texturas guían cada diseño.</p></div><div><h3>Creación a mano</h3><p>Cada pieza toma forma puntada a puntada.</p></div><div><h3>Una pieza especial para ti</h3><p>Accesorios tejidos para acompañarte día a día.</p></div></div></section>
  </>
}