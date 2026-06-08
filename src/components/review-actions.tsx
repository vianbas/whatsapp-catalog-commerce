"use client"

import { Check, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { approveReview, deleteReview } from "@/app/admin/reviews/actions"

export function ReviewActions({
  id,
  isApproved,
}: {
  id: string
  isApproved: boolean
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      {!isApproved && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Approve review"
          onClick={() => approveReview(id)}
        >
          <Check className="size-4 text-green-600" />
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Delete review"
        onClick={() => deleteReview(id)}
      >
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  )
}
