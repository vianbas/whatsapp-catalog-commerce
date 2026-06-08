import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { createSnapToken } from "@/lib/midtrans"
import type { Order } from "@/lib/types"

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const { orderId } = (body ?? {}) as { orderId?: string }
  if (!orderId || typeof orderId !== "string") {
    return NextResponse.json({ error: "orderId required" }, { status: 422 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Customer can read their own order via orders_customer_read RLS policy
  const { data: orderData } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle()

  if (!orderData) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  const order = orderData as Order

  if (order.payment_status === "paid" || order.payment_status === "pending") {
    return NextResponse.json({ error: "Payment already processed" }, { status: 409 })
  }

  // Midtrans requires unique order_id per transaction — append timestamp suffix.
  // The webhook strips the "-r<ts>" suffix to look up by midtrans_order_id.
  // UUIDs are hex-only so "-r" is unambiguous as a separator.
  const retryMidtransId = `${orderId}-r${Date.now()}`
  const origin = request.headers.get("origin") ?? request.nextUrl.origin

  let snapToken: string
  try {
    snapToken = await createSnapToken({
      orderId: retryMidtransId,
      grossAmount: order.total,
      customerName: order.customer_name ?? "Customer",
      customerPhone: order.customer_phone ?? "",
      finishRedirectUrl: `${origin}/orders/${orderId}`,
    })
  } catch (err) {
    console.error("[Midtrans] retry token error:", err)
    return NextResponse.json({ error: "Payment gateway error" }, { status: 502 })
  }

  return NextResponse.json({ snapToken })
}
