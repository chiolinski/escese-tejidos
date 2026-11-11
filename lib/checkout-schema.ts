import { z } from 'zod'

export const checkoutSchema = z.object({
  items: z.array(z.object({ variantId: z.string().min(1).max(40), quantity: z.number().int().min(1).max(10) })).min(1).max(30),
  pickup: z.boolean(),
  region: z.string().trim().max(100),
  comuna: z.string().trim().max(100),
  name: z.string().trim().min(2).max(120),
  email: z.email().max(160),
  phone: z.string().trim().regex(/^\+?[\d ()-]{8,20}$/),
  address: z.string().trim().max(200),
  notes: z.string().trim().max(500),
}).refine(data => data.pickup || Boolean(data.region && data.comuna && data.address), 'Completa la dirección de despacho.')
  .refine(data => new Set(data.items.map(item => item.variantId)).size === data.items.length, 'Hay variantes duplicadas.')

export type Checkout = z.infer<typeof checkoutSchema>
