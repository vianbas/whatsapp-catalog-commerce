import { z } from "zod"
import { SLUG_PATTERN } from "@/lib/slug"

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(120)
    .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens"),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().int().min(0).default(0),
})

export type CategoryInput = z.infer<typeof categorySchema>
