import { sendOrderConfirmationToCustomer } from "@/lib/whatsapp-api"
import { sendOrderConfirmationEmail } from "@/lib/email"

/** Order shape returned by the `settle_payment` RPC. */
export interface SettledOrder {
  id: string
  customer_id: string | null
  customer_phone: string | null
  customer_email: string | null
  customer_name: string | null
  items: { name: string; quantity: number; price: number }[]
  total: number
}

/**
 * Fire-and-forget payment-confirmation notifications (WhatsApp + email).
 *
 * Called from both the Midtrans webhook and the check-status poller — whichever
 * resolves the payment first. `settle_payment` guarantees the caller only sees
 * `notified = true` on the single transition into `paid`, so this never
 * double-sends regardless of which path wins.
 */
export function notifyOrderConfirmed(order: SettledOrder): void {
  if (order.customer_phone) {
    void sendOrderConfirmationToCustomer(
      order.customer_phone,
      order.id,
      order.items,
      order.total
    ).catch(() => {})
  }
  if (order.customer_email) {
    const guestPhone = !order.customer_id ? order.customer_phone ?? null : null
    void sendOrderConfirmationEmail(
      order.customer_email,
      order.id,
      order.items,
      order.total,
      order.customer_name,
      "paid",
      guestPhone
    ).catch(() => {})
  }
}
