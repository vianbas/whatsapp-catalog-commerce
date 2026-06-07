import { z } from "zod"

export const orderItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  price: z.number().int().min(0),
  quantity: z.number().int().min(1),
  product_id: z.string().uuid().optional(),
})

export const orderInputSchema = z.object({
  items: z.array(orderItemSchema).min(1, "An order must have at least one item"),
  total: z.number().int().min(0),
  source: z.string().trim().max(40).optional(),
})

export type OrderInput = z.infer<typeof orderInputSchema>
