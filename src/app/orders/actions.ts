"use server"

import { createClient } from "@/lib/supabase/server"
import { orderInputSchema, type OrderInput } from "@/lib/validations/order"
import { sendOrderNotification } from "@/lib/whatsapp-api"

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
  const { error } = await supabase.from("orders").insert({
    items: parsed.data.items,
    total: parsed.data.total,
    source: parsed.data.source ?? null,
    customer_id: user?.id ?? null,
    customer_name: parsed.data.customer_name ?? null,
    customer_phone: parsed.data.customer_phone ?? null,
    customer_address: parsed.data.customer_address ?? null,
    notes: parsed.data.notes ?? null,
  })
  if (error) return { error: error.message }

  // Best-effort API notification — never blocks or fails the order record.
  void sendOrderNotification(parsed.data.items, parsed.data.total, parsed.data.source).catch(() => {})
}
