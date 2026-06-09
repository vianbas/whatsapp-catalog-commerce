"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Shown when ?processing=1 is in the URL and payment_status is still unpaid.
 * Every 3s it calls /api/midtrans/check-status, which actively queries Midtrans
 * and writes the result to the DB. Then router.refresh() re-runs the server
 * component — when payment_status changes the banner disappears automatically.
 */
export function PaymentProcessingPoller({
  orderId,
  paymentStatus,
}: {
  orderId: string
  paymentStatus: string
}) {
  const router = useRouter()

  React.useEffect(() => {
    if (paymentStatus !== "unpaid") return

    const poll = async () => {
      try {
        const res = await fetch(`/api/midtrans/check-status?orderId=${orderId}`)
        if (res.ok) {
          const { payment_status } = (await res.json()) as { payment_status: string }
          if (payment_status !== "unpaid") {
            router.refresh()
            return
          }
        }
      } catch {
        // network blip — try again next tick
      }
      router.refresh()
    }

    const id = setInterval(() => { void poll() }, 3000)
    return () => clearInterval(id)
  }, [orderId, router, paymentStatus])

  if (paymentStatus !== "unpaid") return null

  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      <span>Payment is being processed — this page will update automatically.</span>
    </div>
  )
}
