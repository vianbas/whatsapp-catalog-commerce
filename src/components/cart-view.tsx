"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Package, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { WhatsappCheckoutButton } from "@/components/whatsapp-checkout-button"
import { clearCart, removeFromCart, setQuantity, useCart } from "@/lib/cart"
import { formatRupiah } from "@/lib/utils"

export function CartView({
  phone,
  greeting,
}: {
  phone: string
  greeting?: string
}) {
  const { items, count, total } = useCart()

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

  return (
    <div className="space-y-6">
      <ul className="divide-y rounded-lg border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 p-3">
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

            <div className="min-w-0 flex-1">
              <Link
                href={`/products/${item.slug}`}
                className="line-clamp-1 text-sm font-medium hover:underline"
              >
                {item.name}
              </Link>
              <p className="text-muted-foreground text-sm">
                {formatRupiah(item.price)}
              </p>
            </div>

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

            <div className="w-24 text-right text-sm font-medium tabular-nums">
              {formatRupiah(item.price * item.quantity)}
            </div>

            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${item.name}`}
              onClick={() => removeFromCart(item.id)}
            >
              <Trash2 className="size-4" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t pt-4">
        <span className="text-sm font-medium">Total</span>
        <span className="text-lg font-semibold">{formatRupiah(total)}</span>
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
          items={items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          }))}
          label={`Order ${count} item${count === 1 ? "" : "s"} via WhatsApp`}
          className="sm:w-auto"
        />
      </div>
    </div>
  )
}
