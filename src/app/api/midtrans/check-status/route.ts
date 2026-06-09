import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { queryTransactionStatus, mapPaymentStatus } from "@/lib/midtrans"
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

  // order.payment_status is "unpaid" here (checked above); always write the Midtrans result.
  await supabase
    .from("orders")
    .update({
      payment_status: newStatus,
      payment_type: txn.payment_type ?? null,
    })
    .eq("id", orderId)

  return NextResponse.json({ payment_status: newStatus })
}
