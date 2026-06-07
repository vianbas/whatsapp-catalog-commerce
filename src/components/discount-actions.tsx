"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  toggleDiscountCode,
  deleteDiscountCode,
} from "@/app/admin/discounts/actions"

export function DiscountActions({
  id,
  code,
  isActive,
}: {
  id: string
  code: string
  isActive: boolean
}) {
  const router = useRouter()
  const [pending, startTransition] = React.useTransition()

  function handleToggle() {
    startTransition(async () => {
      await toggleDiscountCode(id, !isActive)
      router.refresh()
    })
  }

  function handleDelete() {
    if (!confirm(`Delete discount code "${code}"? This cannot be undone.`)) return
    startTransition(async () => {
      await deleteDiscountCode(id)
      router.refresh()
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" disabled={pending} aria-label="Actions">
          <MoreHorizontal className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleToggle}>
          {isActive ? "Disable" : "Enable"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive"
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
