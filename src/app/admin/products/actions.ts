"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import { productSchema, type ProductInput } from "@/lib/validations/product"

export type ActionResult = { error: string } | void

/** Map a validated form payload to a `products` row. */
function toRow(values: ProductInput) {
  return {
    name: values.name,
    slug: values.slug,
    description: values.description ? values.description : null,
    category_id: values.category_id ?? null,
    price: values.price,
    compare_at_price: values.compare_at_price ?? null,
    images: values.images,
    stock_quantity: values.stock_quantity ?? null,
    // Auto-mark sold out when quantity is explicitly set to zero.
    stock_status: values.stock_quantity === 0 ? "sold_out" : values.stock_status,
    is_featured: values.is_featured,
    is_active: values.is_active,
    sort_order: values.sort_order,
  }
}

/** Turn opaque Postgres errors into something the admin can act on. */
function humanizeDbError(message: string): string {
  if (message.includes("duplicate key") || message.includes("products_slug_key")) {
    return "A product with this slug already exists. Choose a different slug."
  }
  return message
}

/**
 * Ensure the caller is authenticated before mutating. RLS is still the real
 * boundary; this gives a clean redirect instead of a silent RLS failure.
 */
async function requireSupabase() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return supabase
}

export async function createProduct(values: ProductInput): Promise<ActionResult> {
  // Re-validate on the server — never trust the client payload.
  const parsed = productSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await requireSupabase()
  const { error } = await supabase.from("products").insert(toRow(parsed.data))
  if (error) return { error: humanizeDbError(error.message) }

  revalidatePath("/admin/products")
  redirect("/admin/products")
}

export async function updateProduct(
  id: string,
  values: ProductInput
): Promise<ActionResult> {
  const parsed = productSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await requireSupabase()
  const { error } = await supabase
    .from("products")
    .update(toRow(parsed.data))
    .eq("id", id)
  if (error) return { error: humanizeDbError(error.message) }

  revalidatePath("/admin/products")
  revalidatePath(`/admin/products/${id}/edit`)
  redirect("/admin/products")
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await requireSupabase()
  const { error } = await supabase.from("products").delete().eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/products")
}
