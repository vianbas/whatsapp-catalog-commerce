"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { createDiscountSchema } from "@/lib/validations/discount"
import type { CreateDiscountInput } from "@/lib/validations/discount"

export type ActionResult = { error: string } | void

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return supabase
}

export async function createDiscountCode(
  input: CreateDiscountInput
): Promise<ActionResult> {
  const parsed = createDiscountSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await requireAdmin()
  const { error } = await supabase.from("discount_codes").insert({
    code: parsed.data.code,
    type: parsed.data.type,
    value: parsed.data.value,
    max_uses: parsed.data.max_uses ?? null,
    expires_at: parsed.data.expires_at ?? null,
    is_active: parsed.data.is_active,
  })
  if (error) return { error: error.message }

  revalidatePath("/admin/discounts")
}

export async function toggleDiscountCode(
  id: string,
  is_active: boolean
): Promise<ActionResult> {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("discount_codes")
    .update({ is_active })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/discounts")
}

export async function deleteDiscountCode(id: string): Promise<ActionResult> {
  const supabase = await requireAdmin()
  const { error } = await supabase
    .from("discount_codes")
    .delete()
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/discounts")
}
