import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { db } from '@/lib/db'
import { saveProduct, saveVariant } from '../../actions'

export const metadata = { title: 'Editar producto', robots: { index: false } }

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params
  const [product, categories] = await Promise.all([
    id === 'nuevo' ? null : db.product.findUnique({ where: { id }, include: { variants: { include: { inventory: true } } } }),
    db.category.findMany({ orderBy: { name: 'asc' } }),
  ])
  if (!product && id !== 'nuevo') notFound()
  return <section className="shell section">
    <Link className="underline" href="/admin">Volver a administración</Link>
    <h1 className="my-6">{product ? 'Editar producto' : 'Crear producto'}</h1>
    {!categories.length ? <p>Crea una categoría desde el panel para agregar productos.</p> : <form action={saveProduct} className="grid max-w-2xl gap-4">
      {product && <input type="hidden" name="id" value={product.id} />}
      <label className="field">Nombre<input name="name" required defaultValue={product?.name} /></label>
      <label className="field">Identificador para la URL<input name="slug" required pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={product?.slug} /></label>
      <label className="field">Categoría<select name="categoryId" required defaultValue={product?.categoryId}>{categories.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label>
      <label className="field">Descripción<textarea name="description" required defaultValue={product?.description} /></label>
      <label className="field">Materiales<textarea name="materials" defaultValue={product?.materials} /></label>
      <label className="field">Cuidados<textarea name="care" defaultValue={product?.care} /></label>
      <label className="field">Precio CLP · usa 0 si queda por confirmar<input name="price" type="number" min="0" required defaultValue={product?.price ?? 0} /></label>
      <label className="field">Plazo para productos a pedido<input name="leadTime" defaultValue={product?.leadTime || ''} /></label>
      <label className="field">Añadir foto · hasta 4 MB<input name="image" type="file" accept="image/jpeg,image/png,image/webp" /></label>
      <label className="flex items-center gap-2"><input name="madeToOrder" type="checkbox" defaultChecked={product?.madeToOrder} /> Confeccionado a pedido</label>
      <label className="flex items-center gap-2"><input name="featured" type="checkbox" defaultChecked={product?.featured} /> Destacado</label>
      <label className="flex items-center gap-2"><input name="published" type="checkbox" defaultChecked={product?.published} /> Publicado</label>
      <button className="button">Guardar producto</button>
    </form>}
    {product && <section className="mt-12 space-y-5"><h2>Variantes y stock</h2>
      <ul>{product.variants.map(variant => <li key={variant.id}>{[variant.color, variant.size].filter(Boolean).join(' · ') || 'Estándar'} · {variant.inventory?.available ?? 0} disponibles</li>)}</ul>
      <p>Para actualizar una variante, escribe el mismo color y talla.</p>
      <form action={saveVariant} className="flex flex-wrap items-end gap-3">
        <input type="hidden" name="productId" value={product.id} />
        <label className="field">Color<input name="color" maxLength={70} /></label>
        <label className="field">Talla<input name="size" maxLength={70} /></label>
        <label className="field">Unidades disponibles<input name="available" type="number" min="0" max="10000" required /></label>
        <button className="button">Guardar variante</button>
      </form>
    </section>}
  </section>
}