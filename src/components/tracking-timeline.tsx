"use client"

import * as React from "react"
import { Loader2, MapPin, CheckCircle2, Circle, RefreshCw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { fetchLiveTracking } from "@/app/orders/tracking-actions"
import type { TrackingResult } from "@/lib/tracking"

const POLL_MS = 5 * 60 * 1000

const STATUS_LABEL: Record<string, string> = {
  DELIVERED: "Terkirim",
  ON_PROCESS: "Dalam Pengiriman",
  PICKED_UP: "Diambil Kurir",
  RETURNED: "Dikembalikan",
  UNDELIVERED: "Gagal Kirim",
}

export function TrackingTimeline({
  courier,
  trackingNumber,
}: {
  courier: string
  trackingNumber: string
}) {
  const [loading, setLoading] = React.useState(true)
  const [result, setResult] = React.useState<TrackingResult | null>(null)
  const deliveredRef = React.useRef(false)

  // doFetch does NOT set loading=true — callers set it before calling so there's
  // no synchronous setState inside useEffect (which triggers the lint rule).
  const doFetch = React.useCallback(async () => {
    try {
      const data = await fetchLiveTracking(courier, trackingNumber)
      setResult(data)
      if (data?.status === "DELIVERED") deliveredRef.current = true
    } catch {
      setResult(null)
    } finally {
      setLoading(false)
    }
  }, [courier, trackingNumber])

  React.useEffect(() => {
    // doFetch's setState calls are async (after await) — no synchronous cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void doFetch()
    const id = setInterval(() => {
      if (!deliveredRef.current) void doFetch()
    }, POLL_MS)
    return () => clearInterval(id)
  }, [doFetch])

  function handleRefresh() {
    setLoading(true)
    void doFetch()
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
        <Loader2 className="size-3.5 animate-spin shrink-0" aria-hidden />
        Memuat status pengiriman…
      </div>
    )
  }

  if (!result) return null

  return (
    <div className="space-y-3 pt-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {STATUS_LABEL[result.status] ?? result.status}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={handleRefresh}
        >
          <RefreshCw className="size-3 mr-1" aria-hidden />
          Refresh
        </Button>
      </div>

      {result.events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Belum ada data pergerakan paket.
        </p>
      ) : (
        <ol className="space-y-0">
          {result.events.map((event, i) => {
            const isLatest = i === 0
            const isLast = i === result.events.length - 1
            return (
              <li key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="mt-0.5 shrink-0">
                    {isLatest ? (
                      <CheckCircle2 className="size-4 text-primary" aria-hidden />
                    ) : (
                      <Circle className="size-4 text-muted-foreground/40" aria-hidden />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className="my-1 w-px flex-1 bg-border"
                      style={{ minHeight: "20px" }}
                    />
                  )}
                </div>
                <div className="pb-4">
                  <p
                    className={`text-sm ${isLatest ? "font-medium" : "text-muted-foreground"}`}
                  >
                    {event.desc}
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-1">
                    {event.location && (
                      <>
                        <MapPin className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                        <span className="text-xs text-muted-foreground">
                          {event.location}
                        </span>
                        <span className="text-xs text-muted-foreground">·</span>
                      </>
                    )}
                    <span className="text-xs text-muted-foreground">{event.date}</span>
                  </div>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </div>
  )
}
