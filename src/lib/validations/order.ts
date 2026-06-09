import { z } from "zod"

export const orderItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  price: z.number().int().min(0),
  quantity: z.number().int().min(1),
  product_id: z.string().uuid().optional(),
})

export const orderInputSchema = z.object({
  id: z.string().uuid().optional(),
  items: z.array(orderItemSchema).min(1, "An order must have at least one item"),
  total: z.number().int().min(0),
  source: z.string().trim().max(40).optional(),
  customer_name: z.string().trim().max(120).optional(),
  customer_phone: z.string().trim().max(30).optional(),
  customer_email: z.string().trim().email("Enter a valid email").max(254).optional().or(z.literal("")),
  customer_address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
})

export type OrderInput = z.infer<typeof orderInputSchema>

export const checkoutFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  phone: z
    .string()
    .trim()
    .min(1, "WhatsApp number is required")
    .max(30)
    .regex(/^[\d\s\-+()]+$/, "Enter a valid phone number"),
  email: z.string().trim().email("Enter a valid email").max(254).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(500).optional(),
})

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>
