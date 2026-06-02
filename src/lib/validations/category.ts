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
  // Kept free of coerce/.default() so the schema's input and output types match
  // — required for React Hook Form's zodResolver to type cleanly. Defaults are
  // supplied by the form (see CategoryFormDialog) and the number input converts
  // its string value at the boundary.
  is_active: z.boolean(),
  sort_order: z.number().int().min(0),
})

export type CategoryInput = z.infer<typeof categorySchema>
