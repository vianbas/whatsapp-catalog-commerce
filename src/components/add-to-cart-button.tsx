"use client"

import * as React from "react"
import { Check, ShoppingCart } from "lucide-react"

import { Button } from "@/components/ui/button"
import { addToCart, type CartItem } from "@/lib/cart"

export function AddToCartButton({
  product,
  disabled,
  className,
}: {
  product: Omit<CartItem, "quantity">
  disabled?: boolean
  className?: string
}) {
  const [added, setAdded] = React.useState(false)
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  function handleAdd() {
    addToCart(product)
    setAdded(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setAdded(false), 1500)
  }

  return (
    <Button
      type="button"
      onClick={handleAdd}
      disabled={disabled}
      className={className}
    >
      {added ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <ShoppingCart className="size-4" aria-hidden />
      )}
      {added ? "Added to cart" : "Add to cart"}
    </Button>
  )
}
