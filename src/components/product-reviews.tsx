"use client"

import * as React from "react"
import { Star } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { submitReview } from "@/app/products/actions"
import type { ProductReview } from "@/lib/types"

function StarRating({
  value,
  onChange,
}: {
  value: number
  onChange: (v: number) => void
}) {
  const [hovered, setHovered] = React.useState(0)
  return (
    <div className="flex gap-0.5" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="cursor-pointer p-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
        >
          <Star
            className={`size-6 transition-colors ${
              (hovered || value) >= n
                ? "fill-amber-400 text-amber-400"
                : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

function StaticStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-3.5 ${
            n <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
          }`}
        />
      ))}
    </div>
  )
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" })

export function ProductReviews({
  productId,
  initialReviews,
}: {
  productId: string
  initialReviews: ProductReview[]
}) {
  const reviews = initialReviews
  const [rating, setRating] = React.useState(0)
  const [name, setName] = React.useState("")
  const [body, setBody] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "submitting" | "done" | "error">("idle")
  const [errorMsg, setErrorMsg] = React.useState("")

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
      : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (rating === 0) { setErrorMsg("Please select a star rating."); setStatus("error"); return }
    if (!name.trim()) { setErrorMsg("Name is required."); setStatus("error"); return }
    setStatus("submitting")
    setErrorMsg("")
    const result = await submitReview({ product_id: productId, reviewer_name: name, rating, body })
    if (result.error) {
      setErrorMsg(result.error)
      setStatus("error")
    } else {
      setStatus("done")
      setRating(0); setName(""); setBody("")
    }
  }

  return (
    <section className="mt-14 space-y-8">
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold tracking-tight">Reviews</h2>
        {avgRating !== null && (
          <div className="flex items-center gap-1.5">
            <StaticStars rating={Math.round(avgRating)} />
            <span className="text-muted-foreground text-sm">
              {avgRating.toFixed(1)} ({reviews.length})
            </span>
          </div>
        )}
      </div>

      {/* Review list */}
      {reviews.length > 0 ? (
        <ul className="space-y-4">
          {reviews.map((r) => (
            <li key={r.id} className="border-b pb-4 last:border-0">
              <div className="mb-1 flex items-center gap-2">
                <StaticStars rating={r.rating} />
                <span className="text-sm font-medium">{r.reviewer_name}</span>
                <span className="text-muted-foreground text-xs">
                  {dateFormatter.format(new Date(r.created_at))}
                </span>
              </div>
              {r.body && <p className="text-muted-foreground text-sm">{r.body}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground text-sm">No reviews yet. Be the first!</p>
      )}

      {/* Submit form */}
      {status === "done" ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          Thank you for your review! It will appear after approval.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border p-4">
          <p className="text-sm font-semibold">Write a review</p>

          <div className="space-y-1">
            <Label>Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reviewer-name">Your name</Label>
            <Input
              id="reviewer-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anonymous"
              maxLength={80}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="review-body">Comment (optional)</Label>
            <Textarea
              id="review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="What did you think?"
              rows={3}
              maxLength={1000}
            />
          </div>

          {status === "error" && (
            <p className="text-destructive text-xs">{errorMsg}</p>
          )}

          <Button type="submit" disabled={status === "submitting"} size="sm">
            {status === "submitting" ? "Submitting…" : "Submit review"}
          </Button>
        </form>
      )}
    </section>
  )
}
