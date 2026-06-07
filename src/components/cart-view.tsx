"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"
import { Minus, Package, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WhatsappCheckoutButton } from "@/components/whatsapp-checkout-button"
import { DiscountInput } from "@/components/discount-input"
import { clearCart, removeFromCart, setQuantity, useCart } from "@/lib/cart"
import { formatRupiah } from "@/lib/utils"
import type { DiscountCode } from "@/lib/validations/discount"

function computeDiscount(subtotal: number, discount: DiscountCode | null): number {
  if (!discount) return 0
  if (discount.type === "percent") {
    return Math.round(subtotal * (discount.value / 100))
  }
  return Math.min(discount.value, subtotal)
}

export function CartView({
  phone,
  greeting,
}: {
  phone: string
  greeting?: string
}) {
  const { items, count, total } = useCart()
  const [discount, setDiscount] = React.useState<DiscountCode | null>(null)

  if (count === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <Package className="text-muted-foreground size-8" aria-hidden />
          <p className="text-muted-foreground text-sm">Your cart is empty.</p>
          <Link href="/products" className="text-sm font-medium hover:underline">
            Browse products →
          </Link>
        </CardContent>
      </Card>
    )
  }

  const discountAmount = computeDiscount(total, discount)
  const finalTotal = Math.max(0, total - discountAmount)

  // Synthetic discount line sent in the WhatsApp message.
  const whatsappItems = items.map((i) => ({
    name: i.name,
    price: i.price,
    quantity: i.quantity,
    product_id: i.id,
  }))

  return (
    <div className="space-y-6">
      <ul className="divide-y rounded-lg border">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3 p-3">
            {/* Thumbnail */}
            <div className="bg-muted relative size-16 shrink-0 overflow-hidden rounded-md">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              ) : (
                <div className="text-muted-foreground flex h-full w-full items-center justify-center">
                  <Package className="size-6" aria-hidden />
                </div>
              )}
            </div>

            {/* Details column */}
            <div className="min-w-0 flex-1 space-y-2">
              {/* Name row + remove */}
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <Link
                    href={`/products/${item.slug}`}
                    className="line-clamp-2 text-sm font-medium leading-snug hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="text-muted-foreground text-sm">
                    {formatRupiah(item.price)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${item.name}`}
                  onClick={() => removeFromCart(item.id)}
                  className="shrink-0"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>

              {/* Qty + line total */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity(item.id, item.quantity - 1)}
                  >
                    <Minus className="size-3.5" />
                  </Button>
                  <span className="w-6 text-center text-sm tabular-nums">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label="Increase quantity"
                    onClick={() => setQuantity(item.id, item.quantity + 1)}
                  >
                    <Plus className="size-3.5" />
                  </Button>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatRupiah(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Promo code */}
      <DiscountInput onApply={setDiscount} />

      {/* Totals */}
      <div className="space-y-1 border-t pt-4">
        {discountAmount > 0 && (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatRupiah(total)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-green-600">
              <span>
                Discount ({discount!.code}
                {discount!.type === "percent" ? ` ${discount!.value}%` : ""})
              </span>
              <span>− {formatRupiah(discountAmount)}</span>
            </div>
          </>
        )}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Total</span>
          <span className="text-lg font-semibold">{formatRupiah(finalTotal)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
        <Button variant="ghost" onClick={clearCart}>
          Clear cart
        </Button>
        <WhatsappCheckoutButton
          phone={phone}
          greeting={greeting}
          recordOrder
          source="cart"
          items={whatsappItems}
          total={finalTotal}
          discountCode={discount?.code}
          discountAmount={discountAmount}
          label={`Order ${count} item${count === 1 ? "" : "s"} via WhatsApp`}
          className="sm:w-auto"
        />
      </div>
    </div>
  )
}
