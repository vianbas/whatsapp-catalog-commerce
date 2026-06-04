"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { OrderStatus } from "@/lib/types"

export type ActionResult = { error: string } | void

const STATUSES: OrderStatus[] = ["new", "contacted", "completed", "cancelled"]

async function requireSupabase() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return supabase
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus
): Promise<ActionResult> {
  if (!STATUSES.includes(status)) return { error: "Invalid status" }

  const supabase = await requireSupabase()
  const { error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
  if (error) return { error: error.message }

  revalidatePath("/admin/orders")
}
