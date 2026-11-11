import Link from 'next/link'
import { db } from '@/lib/db'
import type { Metadata } from 'next'

export const metadata: Metadata = { robots: { index: false } }

const titles: Record<string, string> = {
  paid: 'Pago confirmado',
  rejected: 'Pago rechazado',
  cancelled: 'Pago cancelado',
  failed: 'El pago no pudo iniciarse',
  error: 'No pudimos verificar el pago',
}

export default async function PaymentPage({ params, searchParams }: { params: Promise<{ status: string }>; searchParams: Promise<{ comprobante?: string }> }) {
  const { status } = await params
  const { comprobante } = await searchParams
  const order = status === 'paid' && typeof comprobante === 'string' && /^[a-f0-9-]{36}$/.test(comprobante) && process.env.DATABASE_URL
    ? await db.order.findUnique({ where: { sessionId: comprobante }, select: { state: true } })
    : null
  const message = status === 'paid' && order?.state !== 'PAID' ? titles.error : titles[status] || titles.error
  return <section className="shell section"><h1>{message}</h1><Link className="button mt-8" href="/tienda">Volver a la tienda</Link></section>
}