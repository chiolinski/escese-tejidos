import { db } from '@/lib/db'
import { CheckoutForm } from '@/components/checkout'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const [settings, zones] = process.env.DATABASE_URL
    ? await Promise.all([db.storeSettings.findUnique({ where: { id: 1 } }), db.shippingZone.findMany({ select: { region: true, comuna: true }, orderBy: [{ region: 'asc' }, { comuna: 'asc' }] })])
    : [null, []]
  return <section className="shell section"><h1>Finalizar compra</h1>
    {settings?.pickup || zones.length ? <CheckoutForm zones={zones} canPickup={Boolean(settings?.pickup)} /> : <p className="mt-6">La tienda aún no recibe compras en línea.</p>}
  </section>
}