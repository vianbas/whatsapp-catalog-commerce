"use client"

import { MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { buildCheckoutUrl, type WhatsappLineItem } from "@/lib/whatsapp"

/**
 * Opens a pre-filled WhatsApp chat with the store, containing an order
 * summary. This is the project's "checkout" — no payment gateway.
 */
export function WhatsappCheckoutButton({
  phone,
  items,
  greeting,
  label = "Order via WhatsApp",
  variant = "default",
  className,
  disabled,
}: {
  phone: string
  items: WhatsappLineItem[]
  greeting?: string
  label?: string
  variant?: "default" | "outline"
  className?: string
  disabled?: boolean
}) {
  const href = buildCheckoutUrl({ phone, items, greeting })

  return (
    <Button
      asChild
      variant={variant}
      className={className}
      disabled={disabled || items.length === 0}
    >
      <a href={href} target="_blank" rel="noopener noreferrer">
        <MessageCircle className="size-4" aria-hidden />
        {label}
      </a>
    </Button>
  )
}
