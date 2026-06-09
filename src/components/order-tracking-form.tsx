"use client"

import { useTransition, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateTracking } from "@/app/admin/orders/actions"

interface Props {
  orderId: string
  courier?: string | null
  trackingNumber?: string | null
}

export function OrderTrackingForm({ orderId, courier, trackingNumber }: Props) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    startTransition(async () => {
      const result = await updateTracking(
        orderId,
        fd.get("courier") as string,
        fd.get("tracking_number") as string
      )
      if (result && "error" in result) {
        alert(result.error)
      }
    })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="courier">Courier</Label>
          <Input
            id="courier"
            name="courier"
            placeholder="e.g. JNE, SiCepat"
            defaultValue={courier ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tracking_number">Tracking number</Label>
          <Input
            id="tracking_number"
            name="tracking_number"
            placeholder="e.g. 1234567890"
            defaultValue={trackingNumber ?? ""}
            required
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        {isPending ? "Saving…" : courier ? "Update tracking" : "Save tracking"}
      </Button>
    </form>
  )
}
