'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { allowAttempt, endSession, requireAdmin, startSession, verifyPassword } from '@/lib/auth'
import { db } from '@/lib/db'

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(90)
const text = (max: number) => z.string().trim().max(max)
const money = z.coerce.number().int().min(0).max(100000000)
const dummy = '00000000000000000000000000000000:' + '0'.repeat(128)
const fields = (form: FormData) => Object.fromEntries(form.entries())

export async function signIn(form: FormData) {
  const input = z.object({ email: z.email().max(160), password: z.string().min(1).max(128) }).safeParse(fields(form))
  if (!process.env.DATABASE_URL || !input.success) redirect('/admin/ingresar?error=1')
  if (!(await allowAttempt('admin-login', 12, 600))) redirect('/admin/ingresar?error=1')
  const admin = await db.adminUser.findUnique({ where: { email: input.data.email.toLowerCase() } })
  const valid = verifyPassword(input.data.password, admin?.passwordHash || dummy)
  if (!admin || !valid) redirect('/admin/ingresar?error=1')
  await startSession(admin.id)
  redirect('/admin')
}

export async function signOut() {
  await requireAdmin()
  await endSession()
  redirect('/admin/ingresar')
}

const productInput = z.object({
  slug, name: text(120).min(2), description: text(3000).min(2), materials: text(800),
  care: text(800), leadTime: text(180), price: money, categoryId: text(40).min(1),
})

export async function saveProduct(form: FormData) {
  const { adminId } = await requireAdmin()
  const input = productInput.parse(fields(form))
  const id = form.get('id')?.toString()
  const madeToOrder = form.has('madeToOrder')
  if (madeToOrder && !input.leadTime) throw new Error('Indica el plazo de confección.')
  const data = { ...input, madeToOrder, featured: form.has('featured'), published: form.has('published') }
  const file = form.get('image')
  let picture: { bytes: Uint8Array<ArrayBuffer>; mime: string } | undefined
  if (file instanceof File && file.size) {
    if (file.size > 4 * 1024 * 1024) throw new Error('La imagen debe pesar hasta 4 MB.')
    const bytes = Buffer.from(await file.arrayBuffer())
    const jpeg = bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))
    const png = bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    const webp = bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP'
    if (!jpeg && !png && !webp) throw new Error('Selecciona una imagen JPEG, PNG o WebP.')
    picture = { bytes: Uint8Array.from(bytes), mime: jpeg ? 'image/jpeg' : png ? 'image/png' : 'image/webp' }
  }
  const product = await db.$transaction(async tx => {
    const saved = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data })
    if (picture) {
      const image = await tx.media.create({ data: picture })
      const last = await tx.productImage.aggregate({ where: { productId: saved.id }, _max: { position: true } })
      await tx.productImage.create({ data: { productId: saved.id, url: '/media/' + image.id, alt: saved.name, position: (last._max.position ?? -1) + 1 } })
    }
    await tx.auditLog.create({ data: { adminId, action: 'save_product', target: saved.id } })
    return saved
  })
  revalidatePath('/')
  revalidatePath('/tienda')
  revalidatePath('/productos/' + product.slug)
  redirect('/admin/productos/' + product.id)
}

export async function saveVariant(form: FormData) {
  const { adminId } = await requireAdmin()
  const { productId, color, size, available } = z.object({
    productId: text(40).min(1), color: text(70), size: text(70), available: z.coerce.number().int().min(0).max(10000),
  }).parse(fields(form))
  await db.$transaction(async tx => {
    const variant = await tx.productVariant.upsert({
      where: { productId_color_size: { productId, color, size } },
      create: { productId, color, size }, update: {},
    })
    await tx.inventory.upsert({ where: { variantId: variant.id }, create: { variantId: variant.id, available }, update: { available } })
    await tx.auditLog.create({ data: { adminId, action: 'save_stock', target: variant.id } })
  })
  revalidatePath('/admin/productos/' + productId)
  revalidatePath('/productos/[slug]', 'page')
  revalidatePath('/tienda')
}

export async function addCategory(form: FormData) {
  const { adminId } = await requireAdmin()
  const data = z.object({ slug, name: text(90).min(2) }).parse(fields(form))
  await db.$transaction([
    db.category.create({ data }),
    db.auditLog.create({ data: { adminId, action: 'create_category', target: data.slug } }),
  ])
  revalidatePath('/admin')
  revalidatePath('/tienda')
}

export async function saveShipping(form: FormData) {
  const { adminId } = await requireAdmin()
  const data = z.object({ region: text(100).min(2), comuna: text(100).min(2), price: money }).parse(fields(form))
  const zone = await db.shippingZone.upsert({
    where: { region_comuna: { region: data.region, comuna: data.comuna } },
    create: data, update: { price: data.price },
  })
  await db.auditLog.create({ data: { adminId, action: 'save_shipping', target: zone.id } })
  revalidatePath('/admin')
}

export async function removeShipping(form: FormData) {
  const { adminId } = await requireAdmin()
  const id = text(40).min(1).parse(form.get('id'))
  await db.$transaction([
    db.shippingZone.delete({ where: { id } }),
    db.auditLog.create({ data: { adminId, action: 'delete_shipping', target: id } }),
  ])
  revalidatePath('/admin')
}

export async function saveSettings(form: FormData) {
  const { adminId } = await requireAdmin()
  const input = z.object({
    name: text(120).min(2), contact: text(300), instagram: z.string().regex(/^[A-Za-z0-9._]{1,30}$/),
    shipping: text(8000), returns: text(8000), terms: text(8000), privacy: text(8000),
  }).parse(fields(form))
  const data = { ...input, pickup: form.has('pickup') }
  await db.$transaction([
    db.storeSettings.upsert({ where: { id: 1 }, create: data, update: data }),
    db.auditLog.create({ data: { adminId, action: 'save_settings', target: 'store' } }),
  ])
  revalidatePath('/', 'layout')
}

export async function saveShipment(form: FormData) {
  const { adminId } = await requireAdmin()
  const { id, status } = z.object({
    id: text(40).min(1), status: z.enum(['PENDING', 'PREPARING', 'SHIPPED', 'DELIVERED']),
  }).parse(fields(form))
  await db.$transaction(async tx => {
    const updated = await tx.shipment.updateMany({ where: { orderId: id, order: { state: 'PAID' } }, data: { status } })
    if (updated.count) await tx.auditLog.create({ data: { adminId, action: 'save_shipment', target: id } })
  })
  revalidatePath('/admin')
}