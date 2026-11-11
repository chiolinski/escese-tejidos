import { createHash } from 'node:crypto'
import { allowAttempt } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkoutSchema } from '@/lib/checkout-schema'
import { CheckoutError, createOrder, finishOrder, quoteOrder } from '@/lib/orders'
import { webpay } from '@/lib/webpay'

export async function POST(request: Request) {
  const origin = process.env.APP_URL
  if (!origin || request.headers.get('origin') !== new URL(origin).origin) {
    return Response.json({ error: 'Origen no permitido.' }, { status: 403 })
  }
  if (!process.env.DATABASE_URL) return Response.json({ error: 'Las compras aún no están habilitadas.' }, { status: 503 })
  const body = await request.json().catch(() => null)
  const input = checkoutSchema.safeParse(body)
  if (!input.success) return Response.json({ error: 'Revisa tus datos y el contenido del carrito.' }, { status: 400 })
  try {
    if (body.mode === 'quote') {
      const { subtotal, shipping, total } = await quoteOrder(db, input.data)
      return Response.json({ subtotal, shipping, total })
    }
    if (!Number.isSafeInteger(body.total)) throw new CheckoutError('Actualiza el total antes de pagar.')
    const emailKey = createHash('sha256').update(input.data.email.toLowerCase()).digest('hex')
    if (!(await allowAttempt('checkout:' + emailKey, 5, 600)) || !(await allowAttempt('checkout:store', 60, 600))) {
      return Response.json({ error: 'Demasiados intentos. Intenta nuevamente en unos minutos.' }, { status: 429 })
    }
    const client = webpay()
    const order = await createOrder(input.data, body.total)
    let payment
    try {
      payment = await client.create(order.id, order.sessionId, order.total, new URL('/api/webpay/retorno', origin).href)
    } catch {
      await finishOrder(order.id, 'FAILED')
      return Response.json({ error: 'Webpay no está disponible en este momento.' }, { status: 502 })
    }
    try {
      await db.paymentTransaction.create({ data: { orderId: order.id, token: payment.token } })
    } catch {
      await finishOrder(order.id, 'FAILED')
      return Response.json({ error: 'No fue posible registrar la transacción.' }, { status: 500 })
    }
    return Response.json({ url: payment.url, token: payment.token })
  } catch (error) {
    if (error instanceof CheckoutError) return Response.json({ error: error.message }, { status: 409 })
    return Response.json({ error: 'No fue posible procesar la compra.' }, { status: 500 })
  }
}