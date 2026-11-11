import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from './db'

const cookieName = 'escese-admin'
const sessionLength = 8 * 60 * 60
const digest = (value: string) => createHash('sha256').update(value).digest('hex')

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  return salt + ':' + scryptSync(password, salt, 64).toString('hex')
}

export function verifyPassword(password: string, stored: string) {
  const [salt, expected] = stored.split(':')
  if (!salt || !expected || !/^[a-f0-9]{128}$/.test(expected)) return false
  const actual = hashPassword(password, salt).split(':')[1]
  return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(actual, 'hex'))
}

export async function adminSession() {
  const token = (await cookies()).get(cookieName)?.value
  if (!token || !process.env.DATABASE_URL) return null
  const session = await db.adminSession.findUnique({ where: { hash: digest(token) } })
  return session && session.expiresAt > new Date() ? session : null
}

export async function requireAdmin() {
  const session = await adminSession()
  if (!session) redirect('/admin/ingresar')
  return session
}

export async function startSession(adminId: string) {
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + sessionLength * 1000)
  await db.adminSession.deleteMany({ where: { adminId, expiresAt: { lte: new Date() } } })
  await db.adminSession.create({ data: { hash: digest(token), expiresAt, adminId } })
  const secure = process.env.APP_URL?.startsWith('https://') || process.env.VERCEL_ENV === 'production'
  ;(await cookies()).set(cookieName, token, { httpOnly: true, secure, sameSite: 'lax', path: '/admin', maxAge: sessionLength })
}

export async function endSession() {
  const jar = await cookies()
  const token = jar.get(cookieName)?.value
  if (token) await db.adminSession.deleteMany({ where: { hash: digest(token) } })
  jar.set(cookieName, '', { maxAge: 0, path: '/admin' })
}

export async function allowAttempt(key: string, limit: number, seconds: number) {
  const [row] = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "expiresAt")
    VALUES (${key}, 1, NOW() + ${seconds} * interval '1 second')
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."expiresAt" <= NOW() THEN 1 ELSE LEAST("RateLimit"."count" + 1, ${limit + 1}) END,
      "expiresAt" = CASE WHEN "RateLimit"."expiresAt" <= NOW() THEN EXCLUDED."expiresAt" ELSE "RateLimit"."expiresAt" END
    RETURNING "count"
  `
  return row.count <= limit
}