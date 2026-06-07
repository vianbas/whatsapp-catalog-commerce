import { formatRupiah } from "@/lib/utils"

/**
 * Normalize a phone number into the digits-only international form WhatsApp's
 * `wa.me` links expect (no `+`, no spaces, no separators).
 *
 * Indonesian numbers are commonly written with a leading `0` (national form);
 * we convert that to the `62` country code. A leading `+` or `62` is preserved.
 *   "0812-3456-7890"  → "6281234567890"
 *   "+62 812 3456 7890" → "6281234567890"
 */
export function normalizeWhatsappNumber(raw: string): string {
  const digits = raw.replace(/\D/g, "")
  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`
  }
  return digits
}

export interface WhatsappLineItem {
  name: string
  quantity: number
  price: number
  product_id?: string
}

export interface BuildCheckoutUrlOptions {
  /** Store WhatsApp number in any human format; it will be normalized. */
  phone: string
  items: WhatsappLineItem[]
  /** Optional greeting prepended to the generated order summary. */
  greeting?: string
  /** Override the computed total (e.g. after applying a discount). */
  total?: number
  /** Promo code applied, shown in the message. */
  discountCode?: string
  /** Discount amount in rupiah, shown in the message. */
  discountAmount?: number
}

/**
 * Build a `https://wa.me/<number>?text=...` deep link that pre-fills an order
 * summary. This is the core of the "WhatsApp checkout" flow — no payment
 * gateway, the conversation continues in WhatsApp.
 */
export function buildCheckoutUrl({
  phone,
  items,
  greeting = "Halo, saya ingin memesan:",
  total: totalOverride,
  discountCode,
  discountAmount,
}: BuildCheckoutUrlOptions): string {
  const number = normalizeWhatsappNumber(phone)

  const lines = items.map(
    (item) =>
      `• ${item.name} x${item.quantity} — ${formatRupiah(item.price * item.quantity)}`
  )

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const total = totalOverride ?? subtotal

  const summaryLines: string[] = []
  if (discountCode && discountAmount) {
    summaryLines.push(`Subtotal: ${formatRupiah(subtotal)}`)
    summaryLines.push(`Diskon (${discountCode}): -${formatRupiah(discountAmount)}`)
  }
  summaryLines.push(`Total: ${formatRupiah(total)}`)

  const message = [
    greeting,
    "",
    ...lines,
    "",
    ...summaryLines,
  ].join("\n")

  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}

/** Single-product convenience wrapper for "Order via WhatsApp" buttons. */
export function buildProductCheckoutUrl(
  phone: string,
  product: { name: string; price: number },
  quantity = 1
): string {
  return buildCheckoutUrl({
    phone,
    items: [{ name: product.name, price: product.price, quantity }],
  })
}
