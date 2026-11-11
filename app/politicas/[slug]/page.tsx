import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { instagram, policies } from '@/lib/store'

export default async function Policy({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const policy = policies.find(item => item.slug === slug)
  if (!policy) notFound()
  const settings = process.env.DATABASE_URL ? await db.storeSettings.findUnique({ where: { id: 1 } }) : null
  return <section className="shell section"><h1>{policy.name}</h1>
    <p className="mt-6 whitespace-pre-wrap">{settings?.[policy.field] || 'Información pendiente de publicación.'}</p>
    <a className="mt-4 inline-block underline" href={instagram}>Contactar por Instagram</a>
  </section>
}