'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clp } from '@/lib/store'

type Line = { variantId: string; name: string; price: number; quantity: number; max: number }
type Cart = { lines: Line[]; add: (line: Line) => void; change: (id: string, quantity: number) => void }
export const useCart = create<Cart>()(persist(set => ({
  lines: [],
  add: line => set(({ lines }) => {
    const previous = lines.find(item => item.variantId === line.variantId)
    const updated = { ...line, quantity: Math.min(line.max, (previous?.quantity ?? 0) + line.quantity) }
    return { lines: previous ? lines.map(item => item.variantId === line.variantId ? updated : item) : [...lines, updated] }
  }),
  change: (id, quantity) => set(({ lines }) => ({
    lines: lines.flatMap(item => item.variantId !== id ? [item] : quantity > 0 ? [{ ...item, quantity: Math.min(quantity, item.max) }] : []),
  })),
}), { name: 'escese-carrito' }))

export function CartLink() {
  const count = useCart(state => state.lines.reduce((sum, line) => sum + line.quantity, 0))
  return <Link href="/carrito" className="flex items-center gap-2"><ShoppingBag size={20} aria-hidden /> Carrito <span suppressHydrationWarning>({count})</span></Link>
}

export function AddToCart({ name, price, variants, madeToOrder }: {
  name: string
  price: number
  variants: { id: string; color: string; size: string; inventory: { available: number } | null }[]
  madeToOrder: boolean
}) {
  const add = useCart(state => state.add)
  const options = variants.filter(variant => madeToOrder || (variant.inventory?.available ?? 0) > 0)
  const [id, setId] = useState(options[0]?.id)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const selected = options.find(option => option.id === id)
  if (!selected) return <p>Agotado</p>
  const max = madeToOrder ? 10 : Math.min(10, selected.inventory?.available ?? 0)
  return <form className="grid max-w-xs gap-4" onSubmit={event => {
    event.preventDefault()
    add({ variantId: selected.id, name: [name, selected.color, selected.size].filter(Boolean).join(' · '), price, quantity, max })
    setAdded(true)
  }}>
    <label className="field">Opción<select value={id} onChange={event => { setId(event.target.value); setQuantity(1); setAdded(false) }}>{options.map(option => <option value={option.id} key={option.id}>{[option.color, option.size].filter(Boolean).join(' · ') || 'Estándar'}</option>)}</select></label>
    <p>{madeToOrder ? 'Confeccionado a pedido' : (selected.inventory?.available ?? 0) + ' disponible(s)'}</p>
    <label className="field">Cantidad<input type="number" min="1" max={max} value={quantity} required onChange={event => { setQuantity(event.target.valueAsNumber || 1); setAdded(false) }} /></label>
    <button className="button">Agregar al carrito</button>
    {added && <p role="status">Agregado. <Link className="underline" href="/carrito">Ver carrito</Link></p>}
  </form>
}

export function CartItems() {
  const { lines, change } = useCart()
  if (!lines.length) return <p className="my-8">Tu carrito está vacío.</p>
  return <>
    <ul className="my-8 grid gap-4">{lines.map(line => <li key={line.variantId} className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e8ddec] pb-4">
      <span>{line.name} · {clp.format(line.price)}</span>
      <label className="field">Cantidad<input className="w-20" type="number" min="1" max={line.max} value={line.quantity} onChange={event => change(line.variantId, event.target.valueAsNumber || 1)} /></label>
      <button className="underline" type="button" onClick={() => change(line.variantId, 0)}>Quitar <span className="sr-only">{line.name}</span></button>
    </li>)}</ul>
    <p className="mb-4 font-semibold">Subtotal estimado · {clp.format(lines.reduce((sum, line) => sum + line.price * line.quantity, 0))}</p>
    <Link className="button mb-4" href="/checkout">Finalizar compra</Link>
  </>
}