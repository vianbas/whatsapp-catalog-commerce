"use server"

import { createClient } from "@/lib/supabase/server"
import { orderInputSchema, type OrderInput } from "@/lib/validations/order"
import { sendOrderNotification } from "@/lib/whatsapp-api"
import { sendOrderConfirmationEmail } from "@/lib/email"

/**
 * Record a WhatsApp checkout as an order. Public — storefront shoppers are
 * anonymous, and RLS lets `anon` INSERT (but not read) orders. The insert runs
 * without a returning select so no read policy is needed.
 */
export async function createOrder(
  input: OrderInput
): Promise<{ error: string } | void> {
  const parsed = orderInputSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid order" }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const orderId = crypto.randomUUID()

  const { error } = await supabase.from("orders").insert({
    id: orderId,
    items: parsed.data.items,
    total: parsed.data.total,
    source: parsed.data.source ?? null,
    customer_id: user?.id ?? null,
    customer_name: parsed.data.customer_name ?? null,
    customer_phone: parsed.data.customer_phone ?? null,
    customer_email: parsed.data.customer_email || null,
    customer_address: parsed.data.customer_address ?? null,
    notes: parsed.data.notes ?? null,
  })
  if (error) return { error: error.message }

  const { items, total, customer_email, customer_name } = parsed.data

  // Fire-and-forget notifications — never block or fail the order record.
  // WhatsApp checkout: notify store owner + send "order received" email to customer.
  // Payment confirmation (WA + email) is handled by the Midtrans webhook on paid status.
  void sendOrderNotification(items, total, parsed.data.source).catch(() => {})
  if (customer_email) {
    void sendOrderConfirmationEmail(customer_email, orderId, items, total, customer_name, "received").catch(() => {})
  }
}
