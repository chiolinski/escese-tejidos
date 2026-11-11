import Link from 'next/link'

export default function NotFound() {
  return <section className="shell section"><h1>Página no encontrada</h1><Link className="button mt-6" href="/tienda">Ir a la tienda</Link></section>
}