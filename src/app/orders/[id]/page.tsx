import Link from "next/link"
import type { Metadata } from "next"
import { notFound, redirect } from "next/navigation"
import { CheckCircle2, Circle, XCircle } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/server"
import { formatRupiah } from "@/lib/utils"
import type { Order, OrderStatus } from "@/lib/types"

export const metadata: Metadata = { title: "Order details" }
export const dynamic = "force-dynamic"

const STATUS_STEPS: { status: OrderStatus | "placed"; label: string; description: string }[] = [
  { status: "placed", label: "Order placed", description: "We received your WhatsApp inquiry." },
  { status: "contacted", label: "Contacted", description: "The store has been in touch with you." },
  { status: "completed", label: "Completed", description: "Your order has been fulfilled." },
]

const CANCELLED_STEP = {
  status: "cancelled" as OrderStatus,
  label: "Cancelled",
  description: "This order was cancelled.",
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
})

type StepStatus = "done" | "current" | "upcoming" | "cancelled"

function getStepStatus(
  stepStatus: OrderStatus | "placed",
  orderStatus: OrderStatus
): StepStatus {
  if (orderStatus === "cancelled") return "cancelled"
  const order: (OrderStatus | "placed")[] = ["placed", "new", "contacted", "completed"]
  const stepIdx = order.indexOf(stepStatus === "placed" ? "placed" : stepStatus)
  const orderIdx = order.indexOf(orderStatus === "new" ? "placed" : orderStatus)
  if (stepIdx < orderIdx) return "done"
  if (stepIdx === orderIdx) return "current"
  return "upcoming"
}

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle()

  if (!data) notFound()
  const order = data as Order

  const isCancelled = order.status === "cancelled"
  const steps = isCancelled
    ? [STATUS_STEPS[0], CANCELLED_STEP]
    : STATUS_STEPS

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Link href="/orders" className="text-muted-foreground mb-1 block text-sm hover:underline">
            ← My orders
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Order details</h1>
          <p className="text-muted-foreground text-xs">
            {dateFormatter.format(new Date(order.created_at))}
          </p>
        </div>
        <Badge
          variant={
            order.status === "completed"
              ? "outline"
              : order.status === "cancelled"
                ? "destructive"
                : "default"
          }
          className="capitalize"
        >
          {order.status}
        </Badge>
      </div>

      {/* Status timeline */}
      <div className="mb-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Order progress
        </h2>
        <ol className="space-y-0">
          {steps.map((step, i) => {
            const stepStatus =
              step.status === "cancelled"
                ? "cancelled"
                : step.status === "placed"
                  ? "done"
                  : getStepStatus(step.status, order.status)
            const isLast = i === steps.length - 1

            return (
              <li key={step.status} className="flex gap-4">
                {/* Icon + connector */}
                <div className="flex flex-col items-center">
                  <div className="mt-0.5">
                    {stepStatus === "done" ? (
                      <CheckCircle2 className="size-5 text-primary" />
                    ) : stepStatus === "current" ? (
                      <CheckCircle2 className="size-5 text-primary" />
                    ) : stepStatus === "cancelled" ? (
                      <XCircle className="size-5 text-destructive" />
                    ) : (
                      <Circle className="text-muted-foreground size-5" />
                    )}
                  </div>
                  {!isLast && (
                    <div
                      className={`my-1 w-px flex-1 ${
                        stepStatus === "done" || stepStatus === "current"
                          ? "bg-primary"
                          : "bg-border"
                      }`}
                      style={{ minHeight: "24px" }}
                    />
                  )}
                </div>

                {/* Text */}
                <div className="pb-6">
                  <p
                    className={`text-sm font-medium ${
                      stepStatus === "upcoming"
                        ? "text-muted-foreground"
                        : stepStatus === "cancelled"
                          ? "text-destructive"
                          : "text-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {step.description}
                  </p>
                </div>
              </li>
            )
          })}
        </ol>
      </div>

      <Separator className="mb-8" />

      {/* Items */}
      <div className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Items
        </h2>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span>
                {item.name}{" "}
                <span className="text-muted-foreground">×{item.quantity}</span>
              </span>
              <span className="font-medium tabular-nums">
                {formatRupiah(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-sm font-semibold">Total</span>
          <span className="font-semibold tabular-nums">{formatRupiah(order.total)}</span>
        </div>
      </div>

      {/* Delivery details (if captured) */}
      {(order.customer_name || order.customer_phone || order.customer_address || order.notes) && (
        <>
          <Separator className="mb-8" />
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Delivery details
            </h2>
            <dl className="space-y-1.5 text-sm">
              {order.customer_name && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-16 shrink-0">Name</dt>
                  <dd>{order.customer_name}</dd>
                </div>
              )}
              {order.customer_phone && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-16 shrink-0">Phone</dt>
                  <dd>{order.customer_phone}</dd>
                </div>
              )}
              {order.customer_address && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-16 shrink-0">Address</dt>
                  <dd>{order.customer_address}</dd>
                </div>
              )}
              {order.notes && (
                <div className="flex gap-2">
                  <dt className="text-muted-foreground w-16 shrink-0">Notes</dt>
                  <dd>{order.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </>
      )}
    </main>
  )
}
