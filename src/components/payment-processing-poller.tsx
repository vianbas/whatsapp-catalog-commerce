"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

/**
 * Shown when ?processing=1 is in the URL and payment_status is still unpaid.
 * Calls router.refresh() every 3 s so the server re-fetches from the DB.
 * The parent server component passes the current payment_status — when it
 * changes to "paid" the banner disappears and the page renders normally.
 */
export function PaymentProcessingPoller({
  paymentStatus,
}: {
  paymentStatus: string
}) {
  const router = useRouter()

  React.useEffect(() => {
    if (paymentStatus !== "unpaid") return
    const id = setInterval(() => router.refresh(), 3000)
    return () => clearInterval(id)
  }, [router, paymentStatus])

  if (paymentStatus !== "unpaid") return null

  return (
    <div className="mb-6 flex items-center gap-2 rounded-lg border border-yellow-400 bg-yellow-50 px-4 py-3 text-sm text-yellow-800 dark:border-yellow-700 dark:bg-yellow-950 dark:text-yellow-300">
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      <span>Payment is being processed — this page will update automatically.</span>
    </div>
  )
}
