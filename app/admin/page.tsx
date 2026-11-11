import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { clp } from '@/lib/store'
import { addCategory, removeShipping, saveSettings, saveShipment, saveShipping, signOut } from './actions'

export const metadata = { title: 'Administración', robots: { index: false } }

const statuses = { PENDING: 'Pendiente', PREPARING: 'En preparación', SHIPPED: 'Despachado', DELIVERED: 'Entregado' }

export default async function Admin() {
  await requireAdmin()
  const [orders, paid, pending, products, stock, settings, zones] = await Promise.all([
    db.order.findMany({ orderBy: { createdAt: 'desc' }, take: 30, include: { customer: true, items: true, shipment: true } }),
    db.order.aggregate({ where: { state: 'PAID' }, _sum: { total: true }, _count: true }),
    db.order.count({ where: { state: 'PENDING' } }),
    db.product.findMany({ orderBy: { name: 'asc' }, include: { variants: { include: { inventory: true } } } }),
    db.inventory.aggregate({ _sum: { available: true } }),
    db.storeSettings.findUnique({ where: { id: 1 } }),
    db.shippingZone.findMany({ orderBy: [{ region: 'asc' }, { comuna: 'asc' }] }),
  ])
  const published = products.filter(product => product.published)
  const soldOut = published.filter(product => !product.madeToOrder && !product.variants.some(variant => (variant.inventory?.available ?? 0) > 0))
  return <section className="shell section space-y-12">
    <div className="flex flex-wrap items-center justify-between gap-4"><h1>Administración</h1><form action={signOut}><button className="button secondary">Cerrar sesión</button></form></div>
    <dl className="grid gap-4 rounded bg-[#efe8f6] p-5 sm:grid-cols-5">
      <div><dt>Ventas</dt><dd>{clp.format(paid._sum.total ?? 0)} · {paid._count} pedidos</dd></div>
      <div><dt>Pagos pendientes</dt><dd>{pending}</dd></div><div><dt>Publicados</dt><dd>{published.length}</dd></div>
      <div><dt>Agotados</dt><dd>{soldOut.length}</dd></div><div><dt>Unidades disponibles</dt><dd>{stock._sum.available ?? 0}</dd></div>
    </dl>
    <section className="space-y-4"><h2>Productos</h2><Link className="button" href="/admin/productos/nuevo">Crear producto</Link>
      <ul className="grid gap-2">{products.map(product => <li key={product.id}><Link className="underline" href={'/admin/productos/' + product.id}>{product.name}</Link> · {product.published ? 'Publicado' : 'Borrador'}</li>)}</ul>
      <h3>Categorías</h3><form action={addCategory} className="flex flex-wrap items-end gap-3">
        <label className="field">Nombre<input name="name" required maxLength={90} /></label>
        <label className="field">Identificador para la URL<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" /></label>
        <button className="button secondary">Crear categoría</button>
      </form>
    </section>
    <section className="space-y-4"><h2>Pedidos recientes</h2>
      {!orders.length && <p>Aún no hay pedidos.</p>}
      {orders.map(order => <details key={order.id} className="border-b border-[#e8ddec] py-3">
        <summary className="cursor-pointer">{order.customer.name} · {clp.format(order.total)} · {order.state}</summary>
        <p>Pedido {order.id}</p><p>{order.customer.email} · {order.customer.phone}</p>
        <p>{order.shipment?.pickup ? 'Retiro en Quirihue' : [order.shipment?.address, order.shipment?.comuna, order.shipment?.region].filter(Boolean).join(', ')}</p>
        {order.shipment?.notes && <p>{order.shipment.notes}</p>}
        <ul>{order.items.map(item => <li key={item.id}>{item.quantity} × {item.name} · {clp.format(item.price)}</li>)}</ul>
        {order.state === 'PAID' && order.shipment && <form action={saveShipment} className="mt-4 flex flex-wrap items-end gap-3">
          <input type="hidden" name="id" value={order.id} /><label className="field">Estado de entrega<select name="status" defaultValue={order.shipment.status}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <button className="button secondary">Actualizar entrega</button>
        </form>}
      </details>)}
    </section>
    <section className="space-y-4"><h2>Despacho</h2>
      {zones.map(zone => <form className="flex flex-wrap items-center gap-4" action={removeShipping} key={zone.id}>
        <input type="hidden" name="id" value={zone.id} /><span>{zone.region} · {zone.comuna} · {clp.format(zone.price)}</span><button className="underline">Quitar zona</button>
      </form>)}
      <form action={saveShipping} className="flex flex-wrap items-end gap-3">
        <label className="field">Región<input name="region" required /></label><label className="field">Comuna<input name="comuna" required /></label>
        <label className="field">Tarifa en CLP<input name="price" type="number" min="0" required /></label>
        <button className="button secondary">Guardar zona</button>
      </form>
    </section>
    <section className="space-y-4"><h2>Configuración</h2>
      <form action={saveSettings} className="grid max-w-2xl gap-4">
        <label className="field">Nombre comercial<input name="name" defaultValue={settings?.name || 'Escese Tejidos'} required /></label>
        <label className="field">Contacto<input name="contact" defaultValue={settings?.contact} /></label>
        <label className="field">Usuario de Instagram<input name="instagram" defaultValue={settings?.instagram || 'tejidos_de_scarleth'} required /></label>
        <label className="flex items-center gap-2"><input name="pickup" type="checkbox" defaultChecked={settings?.pickup} /> Habilitar retiro en Quirihue</label>
        <label className="field">Política de despacho<textarea name="shipping" defaultValue={settings?.shipping} /></label>
        <label className="field">Cambios y devoluciones<textarea name="returns" defaultValue={settings?.returns} /></label>
        <label className="field">Términos y condiciones<textarea name="terms" defaultValue={settings?.terms} /></label>
        <label className="field">Privacidad<textarea name="privacy" defaultValue={settings?.privacy} /></label>
        <button className="button">Guardar configuración</button>
      </form>
    </section>
  </section>
}