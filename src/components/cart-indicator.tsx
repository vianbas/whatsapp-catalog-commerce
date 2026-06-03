"use client"

import Link from "next/link"
import { ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useCart } from "@/lib/cart"

/** Cart link with a live item-count badge for storefront pages. */
export function CartIndicator() {
  const { count } = useCart()

  return (
    <Button asChild variant="outline" size="sm" className="relative">
      <Link href="/cart" aria-label={`Cart, ${count} item${count === 1 ? "" : "s"}`}>
        <ShoppingCart className="size-4" aria-hidden />
        Cart
        {count > 0 && (
          <span className="bg-primary text-primary-foreground ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-xs">
            {count}
          </span>
        )}
      </Link>
    </Button>
  )
}
