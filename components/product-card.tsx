import Image from 'next/image'
import Link from 'next/link'
import { clp } from '@/lib/store'

type Product = { slug: string; name: string; images: string[]; price: number | null; available: boolean; madeToOrder: boolean; demo: boolean }

export function ProductCard({ product }: { product: Product }) {
  return <article>
    <Link className="card-image" href={'/productos/' + product.slug} aria-label={product.name}>
      {product.images[0] && <Image src={product.images[0]} alt="" fill sizes="(min-width: 760px) 33vw, 50vw" />}
    </Link>
    <h3 className="mt-4"><Link href={'/productos/' + product.slug}>{product.name}</Link></h3>
    <p className="mt-1 text-sm">{product.demo ? 'Producto de prueba · ' : ''}{product.price === null ? 'Precio y disponibilidad por confirmar' : clp.format(product.price) + ' · ' + (product.madeToOrder ? 'A pedido' : product.available ? 'Disponible' : 'Agotado')}</p>
  </article>
}