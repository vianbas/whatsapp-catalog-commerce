"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function approveReview(id: string) {
  const supabase = await createClient()
  await supabase.from("product_reviews").update({ is_approved: true }).eq("id", id)
  revalidatePath("/admin/reviews")
}

export async function deleteReview(id: string) {
  const supabase = await createClient()
  await supabase.from("product_reviews").delete().eq("id", id)
  revalidatePath("/admin/reviews")
}
