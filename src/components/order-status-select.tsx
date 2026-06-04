"use client"

import * as React from "react"
import { useRouter } from "next/navigation"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateOrderStatus } from "@/app/admin/orders/actions"
import type { OrderStatus } from "@/lib/types"

const OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
]

export function OrderStatusSelect({
  id,
  status,
}: {
  id: string
  status: OrderStatus
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function handleChange(value: string) {
    startTransition(async () => {
      await updateOrderStatus(id, value as OrderStatus)
      router.refresh()
    })
  }

  return (
    <Select value={status} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="h-8 w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
