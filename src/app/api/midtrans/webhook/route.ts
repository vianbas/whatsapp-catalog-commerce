import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { verifyWebhookSignature, mapPaymentStatus } from "@/lib/midtrans"
import { notifyOrderConfirmed, type SettledOrder } from "@/lib/order-notifications"

interface MidtransNotification {
  order_id: string
  status_code: string
  gross_amount: string
  signature_key: string
  transaction_status: string
  fraud_status?: string
  payment_type?: string
}

function isValidNotification(v: unknown): v is MidtransNotification {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as MidtransNotification).order_id === "string" &&
    typeof (v as MidtransNotification).status_code === "string" &&
    typeof (v as MidtransNotification).gross_amount === "string" &&
    typeof (v as MidtransNotification).signature_key === "string" &&
    typeof (v as MidtransNotification).transaction_status === "string"
  )
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return new NextResponse("Bad request", { status: 400 })
  }

  if (!isValidNotification(body)) {
    return new NextResponse("Bad request", { status: 400 })
  }

  const valid = await verifyWebhookSignature(body)
  if (!valid) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  const paymentStatus = mapPaymentStatus(body.transaction_status, body.fraud_status)

  // Both first-payment and retry order_ids encode the base UUID:
  //   first payment : "{uuid}"
  //   retry         : "{uuid}-r{timestamp}"
  // Strip the "-r…" suffix to get the UUID, then look up by orders.id.
  const baseOrderId = body.order_id.includes("-r")
    ? body.order_id.substring(0, body.order_id.lastIndexOf("-r"))
    : body.order_id

  const supabase = await createClient()

  // settle_payment (SECURITY DEFINER) applies the status, reconciles reserved
  // stock (release on failed / re-reserve on paid), and returns the order with
  // `notified = true` only on the single transition into paid. A direct
  // .update() here would be blocked by RLS — the webhook runs as anon.
  const { data, error } = await supabase.rpc("settle_payment", {
    p_order_id: baseOrderId,
    p_status: paymentStatus,
    p_payment_type: body.payment_type ?? null,
  })

  if (error) {
    console.error("[Midtrans webhook] settle_payment error:", error)
  }

  const order = (data as (SettledOrder & { notified: boolean })[] | null)?.[0]
  if (order?.notified) {
    notifyOrderConfirmed(order)
  }

  return new NextResponse("OK", { status: 200 })
}
