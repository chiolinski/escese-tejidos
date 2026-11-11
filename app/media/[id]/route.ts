import { db } from '@/lib/db'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!process.env.DATABASE_URL || !/^[a-z0-9]{10,35}$/.test(id)) return new Response(null, { status: 404 })
  const photo = await db.media.findUnique({ where: { id } })
  if (!photo) return new Response(null, { status: 404 })
  return new Response(Uint8Array.from(photo.bytes), {
    headers: { 'Content-Type': photo.mime, 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' },
  })
}