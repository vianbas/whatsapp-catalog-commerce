"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, MessageCircle, ShoppingBag, Store } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { MidtransCheckoutButton } from "@/components/midtrans-checkout-button"
import { clearCart, useCart } from "@/lib/cart"
import { cn, formatRupiah } from "@/lib/utils"
import { buildCheckoutUrl } from "@/lib/whatsapp"
import { createOrder } from "@/app/orders/actions"
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validations/order"
import type { BankAccount } from "@/lib/types"

const MIDTRANS_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""

type PaymentMethod = "midtrans" | "bank_transfer" | "cash_pickup" | "whatsapp"

function defaultMethod(
  bankAccounts: BankAccount[],
  cashPickupEnabled: boolean
): PaymentMethod {
  if (MIDTRANS_KEY) return "midtrans"
  if (bankAccounts.length > 0) return "bank_transfer"
  if (cashPickupEnabled) return "cash_pickup"
  return "whatsapp"
}

export function CheckoutForm({
  phone,
  greeting,
  isLoggedIn = false,
  bankAccounts = [],
  cashPickupEnabled = false,
}: {
  phone: string
  greeting?: string
  isLoggedIn?: boolean
  bankAccounts?: BankAccount[]
  cashPickupEnabled?: boolean
}) {
  const { items, count, total } = useCart()
  const router = useRouter()

  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>(
    () => defaultMethod(bankAccounts, cashPickupEnabled)
  )
  const [submitError, setSubmitError] = React.useState<string | null>(null)

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

  function buildItems() {
    return items.map((i) => ({
      name: i.name,
      price: i.price,
      quantity: i.quantity,
      product_id: i.id,
    }))
  }

  function redirectAfter(orderId: string, phone: string) {
    return isLoggedIn
      ? `/orders/${orderId}`
      : `/order-confirmed?id=${orderId}&phone=${encodeURIComponent(phone)}`
  }

  async function onBankTransferSubmit(values: CheckoutFormValues) {
    setSubmitError(null)
    const orderId = crypto.randomUUID()
    const result = await createOrder({
      id: orderId,
      items: buildItems(),
      total,
      source: "bank_transfer",
      customer_name: values.name,
      customer_phone: values.phone,
      customer_email: values.email || undefined,
      customer_address: values.address || undefined,
      notes: values.notes || undefined,
    })
    if (result && "error" in result) { setSubmitError(result.error); return }
    clearCart()
    router.push(redirectAfter(orderId, values.phone))
  }

  async function onCashPickupSubmit(values: CheckoutFormValues) {
    setSubmitError(null)
    const orderId = crypto.randomUUID()
    const result = await createOrder({
      id: orderId,
      items: buildItems(),
      total,
      source: "cash_pickup",
      customer_name: values.name,
      customer_phone: values.phone,
      customer_email: values.email || undefined,
      customer_address: values.address || undefined,
      notes: values.notes || undefined,
    })
    if (result && "error" in result) { setSubmitError(result.error); return }
    clearCart()
    router.push(redirectAfter(orderId, values.phone))
  }

  async function onWhatsAppSubmit(values: CheckoutFormValues) {
    setSubmitError(null)
    const orderId = crypto.randomUUID()
    const result = await createOrder({
      id: orderId,
      items: buildItems(),
      total,
      source: "checkout",
      customer_name: values.name,
      customer_phone: values.phone,
      customer_email: values.email || undefined,
      customer_address: values.address || undefined,
      notes: values.notes || undefined,
    })
    if (result && "error" in result) { setSubmitError(result.error); return }
    const url = buildCheckoutUrl({
      phone,
      greeting,
      items: buildItems(),
      total,
      customerName: values.name,
      customerPhone: values.phone,
      customerAddress: values.address || undefined,
      notes: values.notes || undefined,
    })
    clearCart()
    window.open(url, "_blank", "noopener,noreferrer")
    router.push(redirectAfter(orderId, values.phone))
  }

  async function onMidtransSubmit(values: CheckoutFormValues) {
    setSubmitError(null)
    const res = await fetch("/api/midtrans/snap-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: buildItems(),
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
      const body = await res.json().catch(() => ({})) as { error?: string }
      setSubmitError(body.error ?? "Payment setup failed. Please try again.")
      return
    }
    const { snapToken, orderId } = (await res.json()) as { snapToken: string; orderId: string }
    window.snap?.pay(snapToken, {
      onSuccess: () => { clearCart(); router.push(redirectAfter(orderId, values.phone)) },
      onPending: () => { clearCart(); router.push(redirectAfter(orderId, values.phone)) },
      onError: () => setSubmitError("Payment failed. Please try again."),
      onClose: () => setSubmitError("Payment cancelled. You can try again whenever you're ready."),
    })
  }

  function getSubmitHandler() {
    switch (paymentMethod) {
      case "bank_transfer": return handleSubmit(onBankTransferSubmit)
      case "cash_pickup":   return handleSubmit(onCashPickupSubmit)
      case "whatsapp":      return handleSubmit(onWhatsAppSubmit)
      case "midtrans":      return handleSubmit(onMidtransSubmit)
    }
  }

  const methods: { id: PaymentMethod; label: string; description: string; icon: React.ReactNode; show: boolean }[] = [
    {
      id: "midtrans",
      label: "Pay Online",
      description: "Card, GoPay, QRIS, bank transfer via Midtrans",
      icon: <ShoppingBag className="size-4" aria-hidden />,
      show: !!MIDTRANS_KEY,
    },
    {
      id: "bank_transfer",
      label: "Bank Transfer",
      description: "Transfer to our account, we confirm manually",
      icon: <Building2 className="size-4" aria-hidden />,
      show: bankAccounts.length > 0,
    },
    {
      id: "cash_pickup",
      label: "Cash Pickup / Bayar di Toko",
      description: "Pick up and pay in person",
      icon: <Store className="size-4" aria-hidden />,
      show: cashPickupEnabled,
    },
    {
      id: "whatsapp",
      label: "Ask via WhatsApp",
      description: "Send your order details and arrange payment via chat",
      icon: <MessageCircle className="size-4" aria-hidden />,
      show: true,
    },
  ]

  const visibleMethods = methods.filter((m) => m.show)

  return (
    <form onSubmit={getSubmitHandler()} className="space-y-8">
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
            Email{" "}
            <span className="text-muted-foreground text-xs font-normal">
              (optional — for order confirmation)
            </span>
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

      {/* Payment method */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold">Payment method</h2>
        <div className="space-y-2">
          {visibleMethods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setPaymentMethod(m.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                paymentMethod === m.id
                  ? "border-primary bg-primary/5"
                  : "hover:bg-muted/50"
              )}
            >
              <span
                className={cn(
                  "flex size-4 shrink-0 items-center justify-center rounded-full border-2",
                  paymentMethod === m.id
                    ? "border-primary bg-primary"
                    : "border-muted-foreground"
                )}
              />
              <span className="text-muted-foreground shrink-0">{m.icon}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.label}</p>
                <p className="text-muted-foreground text-xs">{m.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bank account preview when bank transfer selected */}
      {paymentMethod === "bank_transfer" && bankAccounts.length > 0 && (
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <p className="text-sm font-medium">Transfer to one of these accounts:</p>
          {bankAccounts.map((acct, i) => (
            <div key={i} className="text-sm space-y-0.5">
              <p className="font-medium">{acct.bank}</p>
              <p className="font-mono text-base tracking-wider">{acct.account_number}</p>
              <p className="text-muted-foreground">a.n. {acct.account_holder}</p>
            </div>
          ))}
          <p className="text-muted-foreground text-xs pt-1">
            Please transfer the exact amount ({formatRupiah(total)}) and contact us via WhatsApp with your proof of payment.
          </p>
        </div>
      )}

      {/* Cash pickup info */}
      {paymentMethod === "cash_pickup" && (
        <div className="rounded-lg border bg-muted/30 p-4 text-sm space-y-1">
          <p className="font-medium">Cash payment at pickup</p>
          <p className="text-muted-foreground text-xs">
            Place your order now and pay cash when you collect the item. We&apos;ll confirm the details via WhatsApp.
          </p>
        </div>
      )}

      {submitError && (
        <p className="text-destructive text-center text-sm">{submitError}</p>
      )}

      {/* Submit button */}
      {paymentMethod === "midtrans" ? (
        <MidtransCheckoutButton
          onClick={handleSubmit(onMidtransSubmit)}
          disabled={isSubmitting}
        />
      ) : (
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isSubmitting}
          variant={paymentMethod === "whatsapp" ? "outline" : "default"}
        >
          {paymentMethod === "whatsapp" && <MessageCircle className="size-4" aria-hidden />}
          {paymentMethod === "bank_transfer" && <Building2 className="size-4" aria-hidden />}
          {paymentMethod === "cash_pickup" && <Store className="size-4" aria-hidden />}
          {isSubmitting
            ? "Placing order…"
            : paymentMethod === "whatsapp"
              ? "Ask via WhatsApp"
              : paymentMethod === "bank_transfer"
                ? "Place Order — Bank Transfer"
                : "Place Order — Cash Pickup"}
        </Button>
      )}

      <p className="text-muted-foreground text-center text-xs">
        Pay securely online via Midtrans. WhatsApp is available for questions or order confirmation.
      </p>
    </form>
  )
}
