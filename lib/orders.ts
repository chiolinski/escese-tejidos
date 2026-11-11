import { randomBytes, randomUUID } from 'node:crypto'
import type { PaymentState, Prisma } from '@prisma/client'
import { db } from './db'
import type { Checkout } from './checkout-schema'

export class CheckoutError extends Error {}

export async function quoteOrder(tx: Prisma.TransactionClient, input: Checkout) {
  const variants = await tx.productVariant.findMany({
    where: { id: { in: input.items.map(item => item.variantId) }, product: { published: true, demo: false } },
    include: { product: true, inventory: true },
  })
  const shipping = input.pickup
    ? (await tx.storeSettings.findUnique({ where: { id: 1 } }))?.pickup ? 0 : undefined
    : (await tx.shippingZone.findUnique({ where: { region_comuna: { region: input.region, comuna: input.comuna } } }))?.price
  if (shipping === undefined || shipping < 0) throw new CheckoutError('Selecciona una modalidad de entrega disponible.')
  const items = input.items.map(item => {
    const variant = variants.find(match => match.id === item.variantId)
    if (!variant || variant.product.price <= 0) throw new CheckoutError('Una pieza del carrito ya no está a la venta.')
    const reserved = !variant.product.madeToOrder
    if (reserved && (variant.inventory?.available ?? 0) < item.quantity) throw new CheckoutError('Una pieza del carrito ya no tiene stock suficiente.')
    return { ...item, name: [variant.product.name, variant.color, variant.size].filter(Boolean).join(' · '), price: variant.product.price, reserved }
  })
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  if (subtotal + shipping > 2147483647) throw new CheckoutError('El monto excede el máximo admitido.')
  return { items, shipping, subtotal, total: subtotal + shipping }
}

export async function createOrder(input: Checkout, expectedTotal: number) {
  return db.$transaction(async tx => {
    const quote = await quoteOrder(tx, input)
    if (quote.total !== expectedTotal) throw new CheckoutError('El total cambió. Actualízalo antes de pagar.')
    for (const item of quote.items.filter(item => item.reserved).sort((a, b) => a.variantId.localeCompare(b.variantId))) {
      const reserved = await tx.inventory.updateMany({
        where: { variantId: item.variantId, available: { gte: item.quantity } },
        data: { available: { decrement: item.quantity } },
      })
      if (!reserved.count) throw new CheckoutError('Una pieza del carrito acaba de agotarse.')
    }
    return tx.order.create({
      data: {
        id: randomBytes(12).toString('hex'), sessionId: randomUUID(), total: quote.total, shipping: quote.shipping,
        customer: { create: { name: input.name, email: input.email, phone: input.phone } },
        items: { createMany: { data: quote.items } },
        shipment: { create: {
          pickup: input.pickup, region: input.pickup ? null : input.region,
          comuna: input.pickup ? null : input.comuna, address: input.pickup ? null : input.address, notes: input.notes,
        } },
      },
    })
  })
}

type ProviderResult = { providerStatus: string; responseCode: number; authorizationCode?: string }

export async function finishOrder(orderId: string, state: Exclude<PaymentState, 'PENDING'>, response?: ProviderResult) {
  return db.$transaction(async tx => {
    const update = await tx.order.updateMany({ where: { id: orderId, state: 'PENDING' }, data: { state } })
    if (!update.count) return (await tx.order.findUniqueOrThrow({ where: { id: orderId } })).state
    if (response) await tx.paymentTransaction.update({ where: { orderId }, data: response })
    if (state !== 'PAID') {
      const items = await tx.orderItem.findMany({ where: { orderId, reserved: true }, orderBy: { variantId: 'asc' } })
      for (const item of items) await tx.inventory.update({ where: { variantId: item.variantId }, data: { available: { increment: item.quantity } } })
    }
    return state
  })
}