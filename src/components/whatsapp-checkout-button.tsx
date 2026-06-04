"use client"

import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createOrder } from "@/app/orders/actions"
import { buildCheckoutUrl, type WhatsappLineItem } from "@/lib/whatsapp"

/**
 * Opens a pre-filled WhatsApp chat with the store, containing an order
 * summary. This is the project's "checkout" — no payment gateway.
 *
 * When `recordOrder` is set, it fires a best-effort `createOrder` on click
 * (not awaited, so it never blocks or interferes with the redirect to
 * WhatsApp) to log the inquiry for the admin.
 */
export function WhatsappCheckoutButton({
  phone,
  items,
  greeting,
  label = "Order via WhatsApp",
  variant = "default",
  recordOrder = false,
  source,
  className,
  disabled,
}: {
  phone: string
  items: WhatsappLineItem[]
  greeting?: string
  label?: string
  variant?: "default" | "outline"
  recordOrder?: boolean
  source?: string
  className?: string
  disabled?: boolean
}) {
  const href = buildCheckoutUrl({ phone, items, greeting })

  function handleClick() {
    if (!recordOrder || items.length === 0) return
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    // Fire-and-forget: don't await, let the link open WhatsApp immediately.
    void createOrder({ items, total, source }).catch(() => {})
  }

  return (
    <Button
      asChild
      variant={variant}
      className={className}
      disabled={disabled || items.length === 0}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
      >
        <MessageCircle className="size-4" aria-hidden />
        {label}
      </a>
    </Button>
  )
}
