import { NextRequest, NextResponse } from "next/server"

import { createClient } from "@/lib/supabase/server"
import { createSnapToken } from "@/lib/midtrans"
import { orderInputSchema } from "@/lib/validations/order"

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 })
  }

  const parsed = orderInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 422 }
    )
  }

  const data = parsed.data
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Generate UUID here so we don't need a RETURNING select —
  // anon has no SELECT policy on orders, so .insert().select() would fail RLS.
  const orderId = crypto.randomUUID()

  const { error: insertError } = await supabase
    .from("orders")
    .insert({
      id: orderId,
      items: data.items,
      total: data.total,
      source: "midtrans",
      customer_id: user?.id ?? null,
      customer_name: data.customer_name ?? null,
      customer_phone: data.customer_phone ?? null,
      customer_email: data.customer_email || null,
      customer_address: data.customer_address ?? null,
      notes: data.notes ?? null,
      payment_status: "unpaid",
    })

  if (insertError) {
    console.error("[Midtrans] order insert error:", insertError)
    const message = insertError.message?.includes("Stok tidak cukup")
      ? insertError.message
      : "Failed to create order"
    return NextResponse.json({ error: message }, { status: 500 })
  }

  const origin = request.headers.get("origin") ?? request.nextUrl.origin

  let snapToken: string
  try {
    snapToken = await createSnapToken({
      orderId: orderId,
      grossAmount: data.total,
      customerName: data.customer_name ?? "Customer",
      customerPhone: data.customer_phone ?? "",
      finishRedirectUrl: `${origin}/orders/${orderId}`,
    })
  } catch (err) {
    console.error("[Midtrans] snap token error:", err)
    return NextResponse.json({ error: "Payment gateway error" }, { status: 502 })
  }

  await supabase
    .from("orders")
    .update({ snap_token: snapToken, midtrans_order_id: orderId })
    .eq("id", orderId)

  return NextResponse.json({ snapToken, orderId })
}
