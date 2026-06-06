import { z } from "zod"
import { SLUG_PATTERN } from "@/lib/slug"

export const STOCK_STATUSES = ["available", "sold_out", "preorder"] as const

/**
 * Validation for creating/updating a product.
 *
 * Numeric fields are validated as numbers; the form converts raw `<input>`
 * strings at the boundary (see `product-form.tsx`). The schema is kept free of
 * `coerce`/`.default()` transforms so its input and output types are identical
 * — this is what lets React Hook Form's `zodResolver` type cleanly. Rupiah
 * amounts are whole numbers.
 */
export const productSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(160),
    slug: z
      .string()
      .trim()
      .min(1, "Slug is required")
      .max(160)
      .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens"),
    description: z.string().trim().max(5000).optional().or(z.literal("")),
    category_id: z.string().uuid().nullable().optional(),
    price: z
      .number()
      .int("Price must be a whole number of rupiah")
      .min(0, "Price cannot be negative"),
    compare_at_price: z.number().int().min(0).nullable().optional(),
    images: z.array(z.string().url("Each image must be a valid URL")),
    stock_status: z.enum(STOCK_STATUSES),
    stock_quantity: z.number().int().min(0).nullable().optional(),
    is_featured: z.boolean(),
    is_active: z.boolean(),
    sort_order: z.number().int().min(0),
  })
  .refine(
    (data) =>
      data.compare_at_price == null || data.compare_at_price > data.price,
    {
      message: "Compare-at price should be higher than the selling price",
      path: ["compare_at_price"],
    }
  )

export type ProductInput = z.infer<typeof productSchema>
