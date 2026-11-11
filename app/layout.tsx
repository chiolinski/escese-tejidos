import type { Metadata } from 'next'
import Link from 'next/link'
import { Camera } from 'lucide-react'
import { policies } from '@/lib/store'
import { storeSettings } from '@/lib/catalog'
import { CartLink } from '@/components/cart'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: process.env.APP_URL ? new URL(process.env.APP_URL) : undefined,
  title: { default: 'Escese Tejidos | Tejidos hechos a mano en Quirihue', template: '%s | Escese Tejidos' },
  description: 'Descubre tejidos y accesorios hechos a mano en Quirihue, Región de Ñuble, Chile.',
  openGraph: { type: 'website', locale: 'es_CL', siteName: 'Escese Tejidos' },
}

export default async function Layout({ children }: { children: React.ReactNode }) {
  const settings = await storeSettings()
  const name = settings?.name || 'Escese Tejidos'
  const handle = settings?.instagram || 'tejidos_de_scarleth'
  return <html lang="es-CL"><body>
    <a className="sr-only focus:not-sr-only" href="#contenido">Ir al contenido</a>
    <header className="sticky top-0 z-10 border-b border-[#e8ddec] bg-[#faf8fc]">
      <div className="shell flex min-h-18 flex-wrap items-center justify-between gap-3 py-3">
        <Link className="brand text-3xl font-semibold" href="/">{name}</Link>
        <nav aria-label="Menú principal" className="order-3 flex w-full flex-wrap gap-x-5 gap-y-2 text-sm sm:order-0 sm:w-auto">
          <Link href="/">Inicio</Link><Link href="/tienda">Tienda</Link><Link href="/#historia">Nuestra historia</Link><Link href="/#contacto">Contacto</Link>
        </nav>
        <CartLink />
      </div>
    </header>
    <main id="contenido">{children}</main>
    <footer id="contacto" className="section bg-[#efe8f6]">
      <div className="shell grid gap-8 sm:grid-cols-2">
        <div><Link className="brand text-4xl" href="/">{name}</Link><p>Quirihue, Ñuble · Chile</p>{settings?.contact && <p>{settings.contact}</p>}
          <a className="mt-3 inline-flex items-center gap-2" href={'https://www.instagram.com/' + handle + '/'}><Camera size={18} aria-hidden /> @{handle}</a>
        </div>
        <nav className="grid gap-2" aria-label="Políticas de la tienda">{policies.map(policy => <Link key={policy.slug} href={'/politicas/' + policy.slug}>{policy.name}</Link>)}</nav>
      </div>
    </footer>
  </body></html>
}