'use client'

import { useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { rememberCheckout, useCart } from './cart'
import { clp } from '@/lib/store'

type Fields = { name: string; email: string; phone: string; delivery: string; address: string; notes: string }
type Quote = { subtotal: number; shipping: number; total: number; signature: string }

export function CheckoutForm({ zones, canPickup }: { zones: { region: string; comuna: string }[]; canPickup: boolean }) {
  const lines = useCart(state => state.lines)
  const { register, control, handleSubmit, formState: { isSubmitting } } = useForm<Fields>({
    defaultValues: { delivery: canPickup ? 'pickup' : '0', address: '', notes: '' },
  })
  const [quote, setQuote] = useState<Quote>()
  const [error, setError] = useState('')
  const [payment, setPayment] = useState<{ url: string; token: string; receipt: string }>()
  const delivery = useWatch({ control, name: 'delivery' })
  const pickup = delivery === 'pickup'
  const items = lines.map(({ variantId, quantity }) => ({ variantId, quantity }))
  const signature = JSON.stringify([items, delivery])
  const activeQuote = quote?.signature === signature ? quote : undefined

  const submit = handleSubmit(async fields => {
    setError('')
    const zone = zones[Number(fields.delivery)]
    const input = { ...fields, items, pickup, region: zone?.region || '', comuna: zone?.comuna || '', mode: activeQuote ? 'pay' : 'quote', total: activeQuote?.total }
    try {
      const response = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) })
      const body = await response.json()
      if (!response.ok) {
        setQuote(undefined)
        setError(body.error)
      } else if (activeQuote) {
        setPayment(body)
      } else {
        setQuote({ ...body, signature })
      }
    } catch {
      setError('No se pudo conectar con la tienda. Intenta nuevamente.')
    }
  })
  if (!lines.length) return <p className="mt-6">Agrega una pieza al carrito para continuar.</p>
  if (payment) return <form className="mt-8" action={payment.url} method="post" onSubmit={() => rememberCheckout(payment.receipt, items)}>
    <input type="hidden" name="token_ws" value={payment.token} />
    <button className="button">Continuar en Webpay</button>
  </form>
  return <form onSubmit={submit} className="mt-8 grid max-w-lg gap-4">
    <label className="field">Nombre completo<input {...register('name')} autoComplete="name" required minLength={2} maxLength={120} /></label>
    <label className="field">Correo electrónico<input {...register('email')} type="email" autoComplete="email" required maxLength={160} /></label>
    <label className="field">Teléfono<input {...register('phone')} type="tel" autoComplete="tel" required minLength={8} maxLength={20} /></label>
    <label className="field">Entrega<select {...register('delivery')}>
      {canPickup && <option value="pickup">Retiro coordinado en Quirihue</option>}
      {zones.map((zone, index) => <option key={index} value={index}>{zone.region} · {zone.comuna}</option>)}
    </select></label>
    {!pickup && <label className="field">Dirección<input {...register('address')} autoComplete="street-address" required maxLength={200} /></label>}
    <label className="field">Indicaciones opcionales<textarea {...register('notes')} maxLength={500} /></label>
    {activeQuote && <dl><dt>Subtotal</dt><dd>{clp.format(activeQuote.subtotal)}</dd><dt>Entrega</dt><dd>{clp.format(activeQuote.shipping)}</dd><dt className="font-bold">Total</dt><dd>{clp.format(activeQuote.total)}</dd></dl>}
    {error && <p role="alert">{error}</p>}
    <button className="button" disabled={isSubmitting}>{activeQuote ? 'Preparar pago en Webpay' : 'Calcular total'}</button>
  </form>
}