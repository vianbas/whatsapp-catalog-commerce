"use server"

import { createClient } from "@/lib/supabase/server"
import { discountCodeSchema, type DiscountCode } from "@/lib/validations/discount"

export async function validateDiscountCode(
  code: string
): Promise<{ discount: DiscountCode } | { error: string }> {
  if (!code.trim()) return { error: "Enter a code" }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc("apply_discount_code", {
      p_code: code.trim(),
    })
    if (error) return { error: error.message }
    if (!data) return { error: "Invalid or expired code" }

    const parsed = discountCodeSchema.safeParse(data)
    if (!parsed.success) return { error: "Invalid code response" }

    return { discount: parsed.data }
  } catch {
    return { error: "Could not validate code" }
  }
}
