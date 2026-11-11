import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const shared = globalThis as typeof globalThis & { prisma?: PrismaClient }
export const db = shared.prisma ?? new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
})
if (process.env.NODE_ENV !== 'production') shared.prisma = db