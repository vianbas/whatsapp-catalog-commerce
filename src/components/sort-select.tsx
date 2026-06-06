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

const OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "newest", label: "Newest" },
] as const

export type SortOption = (typeof OPTIONS)[number]["value"]

export function SortSelect({
  value,
  category,
  q,
}: {
  value: SortOption
  category?: string
  q?: string
}) {
  const router = useRouter()

  function handleChange(next: string) {
    const params = new URLSearchParams()
    if (category) params.set("category", category)
    if (q) params.set("q", q)
    if (next !== "featured") params.set("sort", next)
    const qs = params.toString()
    router.push(`/products${qs ? `?${qs}` : ""}`)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-sm">Sort:</span>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger className="h-8 w-44">
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
    </div>
  )
}
