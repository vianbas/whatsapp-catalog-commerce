"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"

const CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""
const IS_PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
const SNAP_JS_URL = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js"

export function PaymentRetryButton({ orderId }: { orderId: string }) {
  const router = useRouter()
  const [snapReady, setSnapReady] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [success, setSuccess] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!CLIENT_KEY) return
    if (window.snap) {
      const id = setTimeout(() => setSnapReady(true), 0)
      return () => clearTimeout(id)
    }
    const script = document.createElement("script")
    script.src = SNAP_JS_URL
    script.setAttribute("data-client-key", CLIENT_KEY)
    script.onload = () => setSnapReady(true)
    document.body.appendChild(script)
    return () => {
      document.body.removeChild(script)
    }
  }, [])

  async function handlePay() {
    setLoading(true)
    setError(null)

    const res = await fetch("/api/midtrans/retry-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    })

    // 409 means the order is already paid — webhook landed before we refreshed.
    // Refresh the page to show the updated status.
    if (res.status === 409) {
      setLoading(false)
      router.refresh()
      return
    }

    if (!res.ok) {
      setError("Payment setup failed. Please try again.")
      setLoading(false)
      return
    }

    const { snapToken } = (await res.json()) as { snapToken: string }
    setLoading(false)

    window.snap?.pay(snapToken, {
      onSuccess: () => {
        setSuccess(true)
        // Reload with ?processing=1 so the page polls until payment_status updates.
        setTimeout(() => router.push(`/orders/${orderId}?processing=1`), 500)
      },
      onPending: () => {
        setTimeout(() => router.push(`/orders/${orderId}?processing=1`), 500)
      },
      onError: () => setError("Payment failed. Please try again."),
      onClose: () => setError("Payment cancelled."),
    })
  }

  if (!CLIENT_KEY) return null

  if (success) {
    return (
      <p className="text-center text-sm font-medium text-green-700 dark:text-green-400">
        Payment received! Updating status…
      </p>
    )
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePay}
        disabled={!snapReady || loading}
        className="w-full"
        size="lg"
      >
        <CreditCard className="size-4" aria-hidden />
        {loading
          ? "Setting up payment…"
          : snapReady
            ? "Complete Payment"
            : "Loading payment…"}
      </Button>
      {error && <p className="text-destructive text-center text-sm">{error}</p>}
    </div>
  )
}
