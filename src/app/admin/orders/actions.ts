"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { OrderStatus } from "@/lib/types"
import { sendStatusNotification, sendTrackingNotification } from "@/lib/whatsapp-api"
import { sendTrackingEmail } from "@/lib/email"

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
  const { data, error } = await supabase
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("customer_phone")
    .single()
  if (error) return { error: error.message }

  if (data?.customer_phone) {
    void sendStatusNotification(data.customer_phone, id, status).catch(() => {})
  }

  revalidatePath("/admin/orders")
}

export async function updateTracking(
  id: string,
  courier: string,
  trackingNumber: string
): Promise<ActionResult> {
  const c = courier.trim()
  const t = trackingNumber.trim()
  if (!c || !t) return { error: "Courier and tracking number are required" }

  const supabase = await requireSupabase()
  const { data, error } = await supabase
    .from("orders")
    .update({ courier: c, tracking_number: t })
    .eq("id", id)
    .select("customer_phone, customer_email, customer_name")
    .single()
  if (error) return { error: error.message }

  if (data?.customer_phone) {
    void sendTrackingNotification(data.customer_phone, id, c, t).catch(() => {})
  }
  if (data?.customer_email) {
    void sendTrackingEmail(data.customer_email, id, c, t, data.customer_name).catch(() => {})
  }

  revalidatePath(`/admin/orders/${id}`)
}
