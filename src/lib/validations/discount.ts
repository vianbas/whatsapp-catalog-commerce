import { z } from "zod"

export const discountCodeSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  type: z.enum(["percent", "flat"]),
  value: z.number().int().positive(),
})

export type DiscountCode = z.infer<typeof discountCodeSchema>

export const createDiscountSchema = z.object({
  code: z.string().trim().min(3).max(40).toUpperCase(),
  type: z.enum(["percent", "flat"]),
  value: z.number().int().positive(),
  max_uses: z.number().int().positive().optional(),
  expires_at: z.string().datetime({ offset: true }).optional(),
  is_active: z.boolean(),
})

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>
