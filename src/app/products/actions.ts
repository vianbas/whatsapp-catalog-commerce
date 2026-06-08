"use server"

import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const reviewSchema = z.object({
  product_id: z.string().uuid(),
  reviewer_name: z.string().trim().min(1).max(80),
  rating: z.number().int().min(1).max(5),
  body: z.string().trim().max(1000).optional(),
})

export async function submitReview(
  input: unknown
): Promise<{ error?: string; success?: boolean }> {
  const parsed = reviewSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const supabase = await createClient()
  const { error } = await supabase.from("product_reviews").insert({
    product_id: parsed.data.product_id,
    reviewer_name: parsed.data.reviewer_name,
    rating: parsed.data.rating,
    body: parsed.data.body ?? null,
    is_approved: false,
  })
  if (error) return { error: error.message }
  return { success: true }
}
