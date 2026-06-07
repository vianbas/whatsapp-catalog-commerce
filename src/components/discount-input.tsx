"use client"

import * as React from "react"
import { Tag, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { validateDiscountCode } from "@/app/cart/actions"
import type { DiscountCode } from "@/lib/validations/discount"

export function DiscountInput({
  onApply,
}: {
  onApply: (discount: DiscountCode | null) => void
}) {
  const [code, setCode] = React.useState("")
  const [applied, setApplied] = React.useState<DiscountCode | null>(null)
  const [error, setError] = React.useState<string>()
  const [pending, startTransition] = React.useTransition()

  function handleApply() {
    if (!code.trim()) return
    setError(undefined)
    startTransition(async () => {
      const result = await validateDiscountCode(code)
      if ("error" in result) {
        setError(result.error)
        return
      }
      setApplied(result.discount)
      onApply(result.discount)
    })
  }

  function handleRemove() {
    setApplied(null)
    setCode("")
    setError(undefined)
    onApply(null)
  }

  if (applied) {
    const label =
      applied.type === "percent"
        ? `${applied.value}% off`
        : `Rp ${applied.value.toLocaleString("id-ID")} off`

    return (
      <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Tag className="size-3.5 text-green-600" aria-hidden />
          <span className="font-mono font-medium">{applied.code}</span>
          <span className="text-muted-foreground">— {label}</span>
        </div>
        <button
          onClick={handleRemove}
          aria-label="Remove discount"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <Input
          placeholder="Promo code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => e.key === "Enter" && handleApply()}
          className="font-mono uppercase"
        />
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={pending || !code.trim()}
        >
          {pending ? "…" : "Apply"}
        </Button>
      </div>
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  )
}
