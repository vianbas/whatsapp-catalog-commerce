import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { verifyWebhookSignature, mapPaymentStatus } from "@/lib/midtrans"
import { sendOrderConfirmationToCustomer } from "@/lib/whatsapp-api"
import { sendOrderConfirmationEmail } from "@/lib/email"

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
  const { data: order, error } = await supabase
    .from("orders")
    .update({
      payment_status: paymentStatus,
      payment_type: body.payment_type ?? null,
    })
    .eq("id", baseOrderId)
    .select("id, customer_phone, customer_email, customer_name, items, total, status")
    .single()

  if (error) {
    console.error("[Midtrans webhook] update error:", error)
  }

  // Send order confirmation on successful payment — fire and forget.
  if (paymentStatus === "paid" && order) {
    if (order.customer_phone) {
      void sendOrderConfirmationToCustomer(
        order.customer_phone,
        order.id,
        order.items as { name: string; quantity: number; price: number }[],
        order.total
      ).catch(() => {})
    }
    if (order.customer_email) {
      void sendOrderConfirmationEmail(
        order.customer_email,
        order.id,
        order.items as { name: string; quantity: number; price: number }[],
        order.total,
        order.customer_name
      ).catch(() => {})
    }
  }

  return new NextResponse("OK", { status: 200 })
}
