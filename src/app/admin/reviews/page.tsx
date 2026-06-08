import type { Metadata } from "next"
import { Check } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ReviewActions } from "@/components/review-actions"
import { createClient } from "@/lib/supabase/server"
import type { ProductReview } from "@/lib/types"

export const metadata: Metadata = { title: "Reviews" }
export const dynamic = "force-dynamic"

const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" })

export default async function AdminReviewsPage() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("product_reviews")
    .select("*, product:products(name)")
    .order("created_at", { ascending: false })

  const reviews = (data ?? []) as (ProductReview & { product: { name: string } | null })[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Reviews</h1>
        <p className="text-muted-foreground text-sm">
          Approve reviews before they appear on product pages.
        </p>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Reviewer</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-muted-foreground py-10 text-center text-sm">
                  No reviews yet.
                </TableCell>
              </TableRow>
            ) : (
              reviews.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-sm font-medium">
                    {r.product?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">{r.reviewer_name}</TableCell>
                  <TableCell className="text-sm">{r.rating} / 5</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs text-sm">
                    <span className="line-clamp-2">{r.body ?? "—"}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm">
                    {dateFormatter.format(new Date(r.created_at))}
                  </TableCell>
                  <TableCell>
                    {r.is_approved ? (
                      <Badge variant="outline" className="text-green-600">
                        <Check className="mr-1 size-3" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <ReviewActions id={r.id} isApproved={r.is_approved} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
