import Link from 'next/link'
import { CartItems } from '@/components/cart'

export default function CartPage() {
  return <section className="shell section"><h1>Tu carrito</h1><CartItems /><div><Link className="underline" href="/tienda">Continuar comprando</Link></div></section>
}