import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { queryTransactionStatus, mapPaymentStatus } from "@/lib/midtrans"
import { notifyOrderConfirmed, type SettledOrder } from "@/lib/order-notifications"
import type { Order } from "@/lib/types"

export async function GET(request: NextRequest): Promise<NextResponse> {
  const orderId = request.nextUrl.searchParams.get("orderId")
  if (!orderId) {
    return NextResponse.json({ error: "orderId required" }, { status: 422 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: orderData } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .eq("customer_id", user.id)
    .maybeSingle()

  if (!orderData) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const order = orderData as Order

  // Already resolved — no need to call Midtrans.
  if (order.payment_status !== "unpaid") {
    return NextResponse.json({ payment_status: order.payment_status })
  }

  if (!order.midtrans_order_id) {
    return NextResponse.json({ payment_status: order.payment_status })
  }

  const txn = await queryTransactionStatus(order.midtrans_order_id)
  if (!txn) {
    // Midtrans not reachable or transaction not found yet — return current DB state.
    return NextResponse.json({ payment_status: order.payment_status })
  }

  const newStatus = mapPaymentStatus(txn.transaction_status, txn.fraud_status)

  // Route through settle_payment (SECURITY DEFINER) so the write isn't blocked by
  // RLS and reserved stock is reconciled (released on failed / re-reserved on paid).
  // If this poller wins the race to mark the order paid, it also fires the
  // confirmation — settle_payment's `notified` flag keeps it to exactly once.
  const { data, error } = await supabase.rpc("settle_payment", {
    p_order_id: orderId,
    p_status: newStatus,
    p_payment_type: txn.payment_type ?? null,
  })

  if (error) {
    console.error("[Midtrans check-status] settle_payment error:", error)
  }

  const settled = (data as (SettledOrder & { notified: boolean })[] | null)?.[0]
  if (settled?.notified) {
    notifyOrderConfirmed(settled)
  }

  return NextResponse.json({ payment_status: newStatus })
}
