import type { Metadata } from 'next'
import Link from 'next/link'
import { ProductCard } from '@/components/product-card'
import { catalogProducts, catalogCategories } from '@/lib/catalog'


export const metadata: Metadata = { title: 'Tienda' }

export default async function Shop({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, collections, catalog] = await Promise.all([searchParams, catalogCategories(), catalogProducts()])
  const query = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : ''
  const category = typeof params.categoria === 'string' ? params.categoria : ''
  const products = catalog.filter(product =>
    (!category || product.category === category) && product.name.toLocaleLowerCase('es-CL').includes(query.toLocaleLowerCase('es-CL')),
  )
  if (params.orden === 'precio-asc' || params.orden === 'precio-desc') {
    const direction = params.orden === 'precio-asc' ? 1 : -1
    products.sort((a, b) => a.price === null ? Number(b.price !== null) : b.price === null ? -1 : direction * (a.price - b.price))
  }
  return <section className="shell section">
    <h1>Tienda</h1>
    <form className="my-8 flex flex-wrap items-end gap-4">
      <label className="field">Buscar por nombre<input name="q" defaultValue={query} maxLength={100} /></label>
      <label className="field">Colección<select name="categoria" defaultValue={category}><option value="">Todas</option>{collections.map(item => <option key={item.slug} value={item.slug}>{item.name}</option>)}</select></label>
      <label className="field">Ordenar<select name="orden" defaultValue={typeof params.orden === 'string' ? params.orden : ''}><option value="">Novedades</option><option value="precio-asc">Menor precio</option><option value="precio-desc">Mayor precio</option></select></label>
      <button className="button" type="submit">Filtrar</button><Link className="py-3 underline" href="/tienda">Limpiar filtros</Link>
    </form>
    <p className="mb-5 text-sm">{products.length} {products.length === 1 ? 'pieza' : 'piezas'}</p>
    <div className="cards">{products.map(product => <ProductCard key={product.slug} product={product} />)}</div>
  </section>
}