"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { MessageCircle, ShoppingBag } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { MidtransCheckoutButton } from "@/components/midtrans-checkout-button"
import { clearCart, useCart } from "@/lib/cart"
import { formatRupiah } from "@/lib/utils"
import { buildCheckoutUrl } from "@/lib/whatsapp"
import { createOrder } from "@/app/orders/actions"
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validations/order"

export function CheckoutForm({
  phone,
  greeting,
}: {
  phone: string
  greeting?: string
}) {
  const { items, count, total } = useCart()
  const router = useRouter()

  const [midtransError, setMidtransError] = React.useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
  })

  if (count === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <ShoppingBag className="text-muted-foreground size-8" aria-hidden />
        <p className="text-muted-foreground text-sm">Your cart is empty.</p>
        <Link href="/products" className="text-sm font-medium hover:underline">
          Browse products →
        </Link>
      </div>
    )
  }

  function buildCartItems() {
    return {
      whatsappItems: items.map((i) => ({
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        product_id: i.id,
      })),
    }
  }

  async function onWhatsAppSubmit(values: CheckoutFormValues) {
    const { whatsappItems } = buildCartItems()

    const url = buildCheckoutUrl({
      phone,
      greeting,
      items: whatsappItems,
      total,
      customerName: values.name,
      customerPhone: values.phone,
      customerAddress: values.address || undefined,
      notes: values.notes || undefined,
    })

    void createOrder({
      items: whatsappItems,
      total,
      source: "checkout",
      customer_name: values.name,
      customer_phone: values.phone,
      customer_email: values.email || undefined,
      customer_address: values.address || undefined,
      notes: values.notes || undefined,
    }).catch(() => {})

    clearCart()
    window.open(url, "_blank", "noopener,noreferrer")
    router.push("/orders")
  }

  async function onMidtransSubmit(values: CheckoutFormValues) {
    setMidtransError(null)
    const { whatsappItems } = buildCartItems()

    const res = await fetch("/api/midtrans/snap-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: whatsappItems,
        total,
        source: "midtrans",
        customer_name: values.name,
        customer_phone: values.phone,
        customer_email: values.email || undefined,
        customer_address: values.address || undefined,
        notes: values.notes || undefined,
      }),
    })

    if (!res.ok) {
      setMidtransError("Payment setup failed. Please try again.")
      return
    }

    const { snapToken, orderId } = (await res.json()) as {
      snapToken: string
      orderId: string
    }

    window.snap?.pay(snapToken, {
      onSuccess: () => {
        clearCart()
        // ?processing=1 tells the order page to poll until payment_status updates.
        router.push(`/orders/${orderId}?processing=1`)
      },
      onPending: () => {
        clearCart()
        router.push(`/orders/${orderId}?processing=1`)
      },
      onError: () => {
        setMidtransError("Payment failed. Please try again.")
      },
      onClose: () => {
        setMidtransError("Payment cancelled. You can try again whenever you're ready.")
      },
    })
  }

  return (
    <form onSubmit={handleSubmit(onWhatsAppSubmit)} className="space-y-8">
      {/* Order summary */}
      <div className="rounded-lg border">
        <div className="divide-y">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">
                {item.name}{" "}
                <span className="text-foreground font-medium">×{item.quantity}</span>
              </span>
              <span className="font-medium tabular-nums">
                {formatRupiah(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <Separator />
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold">Total</span>
          <span className="text-lg font-semibold tabular-nums">{formatRupiah(total)}</span>
        </div>
      </div>

      {/* Customer details */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold">Delivery details</h2>

        <div className="space-y-1.5">
          <Label htmlFor="name">
            Full name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Your name"
            autoComplete="name"
            {...register("name")}
          />
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">
            WhatsApp number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone"
            type="tel"
            placeholder="0812-3456-7890"
            autoComplete="tel"
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-destructive text-xs">{errors.phone.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">
            Email <span className="text-muted-foreground text-xs font-normal">(optional — for order confirmation)</span>
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-destructive text-xs">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="address">Delivery address</Label>
          <Textarea
            id="address"
            placeholder="Street, city, postal code (optional)"
            rows={3}
            autoComplete="street-address"
            {...register("address")}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            placeholder="Colour, size, special requests… (optional)"
            rows={2}
            {...register("notes")}
          />
        </div>
      </div>

      <MidtransCheckoutButton
        onClick={handleSubmit(onMidtransSubmit)}
        disabled={isSubmitting}
      />

      {midtransError && (
        <p className="text-destructive text-center text-sm">{midtransError}</p>
      )}

      <div className="relative">
        <Separator />
        <span className="bg-background text-muted-foreground absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 text-xs">
          or
        </span>
      </div>

      <Button type="submit" className="w-full" size="lg" variant="outline" disabled={isSubmitting}>
        <MessageCircle className="size-4" aria-hidden />
        {isSubmitting ? "Opening WhatsApp…" : `Order via WhatsApp`}
      </Button>

      <p className="text-muted-foreground text-center text-xs">
        Pay online with card, GoPay, QRIS, or bank transfer — or chat first via WhatsApp.
      </p>
    </form>
  )
}
