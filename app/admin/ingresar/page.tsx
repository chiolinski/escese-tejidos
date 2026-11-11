import { redirect } from 'next/navigation'
import { adminSession } from '@/lib/auth'
import { signIn } from '../actions'

export const metadata = { title: 'Acceso privado', robots: { index: false } }

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await adminSession()) redirect('/admin')
  const { error } = await searchParams
  return <section className="shell section"><h1>Acceso privado</h1>
    <form action={signIn} className="mt-8 grid max-w-sm gap-4">
      <label className="field">Correo electrónico<input name="email" type="email" autoComplete="username" required /></label>
      <label className="field">Contraseña<input name="password" type="password" autoComplete="current-password" maxLength={128} required /></label>
      {error && <p role="alert">No se pudo iniciar sesión. Revisa tus datos e inténtalo más tarde.</p>}
      <button className="button">Ingresar</button>
    </form>
  </section>
}