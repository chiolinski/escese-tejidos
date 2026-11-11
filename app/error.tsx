'use client'

export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="shell section"><h1>Hubo un problema</h1>
    <p className="my-6">Intenta nuevamente. Si estabas pagando, verifica el estado del pedido antes de repetir la compra.</p>
    <button className="button" onClick={reset}>Reintentar</button>
  </section>
}