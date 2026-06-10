"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Guest-facing payment poller for /track. While a Midtrans order is still
 * "unpaid", it calls router.refresh() every 4s so the server component re-runs
 * track_order() and picks up the webhook's DB update — the "Menunggu →
 * Dikonfirmasi" transition then appears without a manual refresh.
 *
 * Unlike the logged-in PaymentProcessingPoller, this does NOT actively query
 * Midtrans (that endpoint is auth-only). It reflects DB state updated by the
 * webhook, which lands within seconds for guest orders.
 */
export function TrackPaymentPoller({ paymentStatus }: { paymentStatus: string }) {
  const router = useRouter()

  React.useEffect(() => {
    if (paymentStatus !== "unpaid") return
    const id = setInterval(() => router.refresh(), 4000)
    return () => clearInterval(id)
  }, [paymentStatus, router])

  if (paymentStatus !== "unpaid") return null

  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      <span>Menunggu konfirmasi pembayaran — halaman ini akan diperbarui otomatis.</span>
    </div>
  )
}
