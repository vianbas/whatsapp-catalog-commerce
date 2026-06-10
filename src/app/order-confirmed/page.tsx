import type { Metadata } from "next"
import Link from "next/link"
import { CheckCircle2, Package } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { TrackPaymentPoller } from "@/components/track-payment-poller"
import { createClient } from "@/lib/supabase/server"
import { formatRupiah } from "@/lib/utils"
import type { OrderItem, OrderStatus } from "@/lib/types"

export const metadata: Metadata = { title: "Pesanan Diterima" }
export const dynamic = "force-dynamic"

const STATUS_LABEL: Record<string, string> = {
  new: "Diterima",
  contacted: "Diproses",
  completed: "Selesai",
  cancelled: "Dibatalkan",
}

const PAYMENT_BADGE: Record<string, { label: string; className: string }> = {
  paid:    { label: "Dibayar", className: "border-green-600 text-green-700 dark:text-green-400" },
  pending: { label: "Menunggu pembayaran", className: "border-yellow-500 text-yellow-700 dark:text-yellow-400" },
  failed:  { label: "Pembayaran gagal", className: "border-destructive text-destructive" },
  unpaid:  { label: "Belum dibayar", className: "text-muted-foreground" },
}

interface ConfirmedOrder {
  id: string
  status: OrderStatus
  items: OrderItem[]
  total: number
  payment_status: string
  source: string | null
}

export default async function OrderConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; phone?: string }>
}) {
  const { id, phone } = await searchParams

  let order: ConfirmedOrder | null = null

  if (id && phone) {
    const supabase = await createClient()
    const { data } = await supabase.rpc("track_order", {
      p_phone: phone,
      p_order_id: id,
    })
    if (data && data.length > 0) {
      order = data[0] as ConfirmedOrder
    }
  }

  const shortId = order
    ? order.id.slice(0, 8).toUpperCase()
    : (id?.slice(0, 8).toUpperCase() ?? "—")

  const trackHref =
    id && phone
      ? `/track?id=${encodeURIComponent(id)}&phone=${encodeURIComponent(phone)}`
      : "/track"

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="size-12 text-green-500" aria-hidden />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Pesanan Diterima!</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Terima kasih — pesanan Anda sedang diproses.
          </p>
        </div>
        <p className="font-mono text-2xl font-bold tracking-wider">#{shortId}</p>
      </div>

      {order && (
        <>
          {order.source === "midtrans" && (
            <TrackPaymentPoller paymentStatus={order.payment_status} />
          )}

          <div className="mb-6 flex items-center gap-2">
            {order.source === "midtrans" &&
              (() => {
                const p =
                  PAYMENT_BADGE[order.payment_status] ?? PAYMENT_BADGE.unpaid
                return (
                  <Badge variant="outline" className={p.className}>
                    {p.label}
                  </Badge>
                )
              })()}
            <Badge
              variant={
                order.status === "completed"
                  ? "outline"
                  : order.status === "cancelled"
                    ? "destructive"
                    : "default"
              }
            >
              {STATUS_LABEL[order.status] ?? order.status}
            </Badge>
          </div>

          <Separator className="my-6" />

          <div className="mb-6">
            <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
              Produk
            </h2>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {item.name}{" "}
                    <span className="text-muted-foreground">
                      ×{item.quantity}
                    </span>
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatRupiah(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3">
              <span className="text-sm font-semibold">Total</span>
              <span className="font-semibold tabular-nums">
                {formatRupiah(order.total)}
              </span>
            </div>
          </div>

          <Separator className="my-6" />
        </>
      )}

      <div className="flex flex-col gap-3">
        <Button asChild className="w-full">
          <Link href={trackHref}>
            <Package className="size-4" aria-hidden />
            Lacak Pesanan
          </Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/products">Lanjut Belanja</Link>
        </Button>
      </div>
    </main>
  )
}
