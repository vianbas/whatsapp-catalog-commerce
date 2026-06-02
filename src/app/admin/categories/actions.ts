"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { categorySchema, type CategoryInput } from "@/lib/validations/category"

export type ActionResult = { error: string } | void

/** Map a validated form payload to a `categories` row. */
function toRow(values: CategoryInput) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description ? values.description : null,
    is_active: values.is_active,
    sort_order: values.sort_order,
  }
}

function humanizeDbError(message: string): string {
  if (message.includes("duplicate key") || message.includes("categories_slug_key")) {
    return "A category with this slug already exists. Choose a different slug."
  }
  return message
}

/** Ensure the caller is authenticated before mutating (RLS is the real gate). */
async function requireSupabase() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return supabase
}

export async function createCategory(
  values: CategoryInput
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await requireSupabase()
  const { error } = await supabase.from("categories").insert(toRow(parsed.data))
  if (error) return { error: humanizeDbError(error.message) }

  // Categories drive the storefront filter, so revalidate the public list too.
  revalidatePath("/admin/categories")
  revalidatePath("/products")
}

export async function updateCategory(
  id: string,
  values: CategoryInput
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await requireSupabase()
  const { error } = await supabase
    .from("categories")
    .update(toRow(parsed.data))
    .eq("id", id)
  if (error) return { error: humanizeDbError(error.message) }

  revalidatePath("/admin/categories")
  revalidatePath("/products")
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await requireSupabase()
  // Products reference categories with ON DELETE SET NULL, so deleting a
  // category simply leaves its products uncategorized — no orphaned rows.
  const { error } = await supabase.from("categories").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/categories")
  revalidatePath("/products")
}
