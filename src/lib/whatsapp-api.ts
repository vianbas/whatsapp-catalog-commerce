/**
 * Meta WhatsApp Cloud API client.
 *
 * Required env vars (set in .env.local):
 *   WHATSAPP_API_PHONE_NUMBER_ID  — the sender phone-number ID from Meta
 *   WHATSAPP_API_TOKEN            — a System User access token with
 *                                   whatsapp_business_messaging permission
 *   WHATSAPP_API_NOTIFY_NUMBER    — the store owner's WhatsApp number to
 *                                   receive order notifications (E.164 without +)
 *
 * Note: free-form text messages can only be sent within a 24-hour customer-
 * service window (recipient messaged your WABA first). For unprompted
 * notifications use an approved template — see Meta's template docs.
 */

const BASE = "https://graph.facebook.com/v19.0"

function isConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_API_PHONE_NUMBER_ID &&
    process.env.WHATSAPP_API_TOKEN &&
    process.env.WHATSAPP_API_NOTIFY_NUMBER
  )
}

interface TextMessagePayload {
  messaging_product: "whatsapp"
  recipient_type: "individual"
  to: string
  type: "text"
  text: { preview_url: boolean; body: string }
}

async function sendTextMessage(to: string, body: string): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_API_PHONE_NUMBER_ID!
  const token = process.env.WHATSAPP_API_TOKEN!

  const payload: TextMessagePayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to,
    type: "text",
    text: { preview_url: false, body },
  }

  const res = await fetch(`${BASE}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`WhatsApp API ${res.status}: ${text}`)
  }
}

export interface OrderNotificationItem {
  name: string
  quantity: number
  price: number
}

function formatRp(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`
}

/**
 * Send a plain-text order notification to the configured store owner number.
 * Silently no-ops when env vars are absent.
 */
export async function sendOrderNotification(
  items: OrderNotificationItem[],
  total: number,
  source?: string | null
): Promise<void> {
  if (!isConfigured()) return

  const to = process.env.WHATSAPP_API_NOTIFY_NUMBER!
  const lines = items.map(
    (i) => `• ${i.name} x${i.quantity} — ${formatRp(i.price * i.quantity)}`
  )

  const body = [
    "🛒 *Pesanan baru masuk*",
    ...(source ? [`Sumber: ${source}`] : []),
    "",
    ...lines,
    "",
    `*Total: ${formatRp(total)}*`,
  ].join("\n")

  await sendTextMessage(to, body)
}
