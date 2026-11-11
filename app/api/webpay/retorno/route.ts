import { db } from '@/lib/db'
import { finishOrder } from '@/lib/orders'
import { webpay } from '@/lib/webpay'

async function handle(request: Request) {
  const params = request.method === 'POST' ? await request.formData().catch(() => null) : new URL(request.url).searchParams
  const approvedToken = params?.get('token_ws')
  const abortedToken = params?.get('TBK_TOKEN')
  const token = approvedToken || abortedToken
  const result = (state: string, receipt?: string) => {
    const url = new URL('/pago/' + state.toLowerCase(), process.env.APP_URL || request.url)
    if (receipt) url.searchParams.set('comprobante', receipt)
    const response = Response.redirect(url, 303)
    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'no-store')
    return new Response(null, { status: 303, headers })
  }
  if (typeof token !== 'string' || !/^[a-zA-Z0-9]{20,128}$/.test(token)) return result('error')
  try {
    const payment = await db.paymentTransaction.findUnique({ where: { token }, include: { order: true } })
    if (!payment) return result('error')
    const { order } = payment
    if (order.state !== 'PENDING') return result(order.state, order.sessionId)
    const client = webpay()
    // Status recovers an approval when commit succeeded but its response was lost.
    const response = approvedToken ? await client.commit(token).catch(() => client.status(token)) : await client.status(token)
    if (response.amount !== order.total || response.buy_order !== order.id || response.session_id !== order.sessionId) return result('error')
    const provider = { providerStatus: response.status, responseCode: response.response_code, authorizationCode: response.authorization_code }
    if (response.status === 'AUTHORIZED' && response.response_code === 0) return result(await finishOrder(order.id, 'PAID', provider), order.sessionId)
    if (response.status === 'FAILED') return result(await finishOrder(order.id, abortedToken ? 'CANCELLED' : 'REJECTED', provider), order.sessionId)
    // An unresolved gateway state retains stock until Transbank reports a terminal outcome.
    return result(abortedToken ? 'cancelled' : 'error')
  } catch {
    return result('error')
  }
}
export const GET = handle
export const POST = handle
