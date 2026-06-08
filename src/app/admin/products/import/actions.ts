"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { slugify } from "@/lib/utils"

export interface CsvRow {
  name: string
  price: number
  description: string
  stock_quantity: number | null
  category_slug: string
}

export interface ImportResult {
  imported: number
  errors: string[]
}

export async function importProducts(rows: CsvRow[]): Promise<ImportResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: categories } = await supabase
    .from("categories")
    .select("id, slug")
  const categoryMap = new Map<string, string>(
    (categories ?? []).map((c) => [c.slug as string, c.id as string])
  )

  const errors: string[] = []
  let imported = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowLabel = `Row ${i + 2}`

    if (!row.name?.trim()) {
      errors.push(`${rowLabel}: name is required`)
      continue
    }
    if (!row.price || row.price <= 0) {
      errors.push(`${rowLabel}: price must be a positive number`)
      continue
    }

    let category_id: string | null = null
    if (row.category_slug) {
      category_id = categoryMap.get(row.category_slug) ?? null
      if (!category_id) {
        errors.push(`${rowLabel}: category slug "${row.category_slug}" not found`)
        continue
      }
    }

    const stock_quantity = row.stock_quantity
    const stock_status = stock_quantity === 0 ? "sold_out" : "in_stock"

    const { error } = await supabase.from("products").insert({
      name: row.name.trim(),
      slug: slugify(row.name),
      description: row.description?.trim() || null,
      category_id,
      price: row.price,
      compare_at_price: null,
      images: [],
      stock_quantity,
      stock_status,
      is_featured: false,
      is_active: true,
      sort_order: 0,
    })

    if (error) {
      if (
        error.message.includes("duplicate key") ||
        error.message.includes("products_slug_key")
      ) {
        errors.push(`${rowLabel}: a product named "${row.name}" already exists`)
      } else {
        errors.push(`${rowLabel}: ${error.message}`)
      }
    } else {
      imported++
    }
  }

  revalidatePath("/admin/products")
  return { imported, errors }
}
