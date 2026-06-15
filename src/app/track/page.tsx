import type { Metadata } from "next"
import { Package } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { TrackPaymentPoller } from "@/components/track-payment-poller"
import { TrackingTimeline } from "@/components/tracking-timeline"
import { createClient } from "@/lib/supabase/server"
import { formatRupiah } from "@/lib/utils"
import type { OrderItem, OrderStatus } from "@/lib/types"

export const metadata: Metadata = { title: "Lacak Pesanan" }
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

interface TrackedOrder {
  id: string
  status: OrderStatus
  created_at: string
  items: OrderItem[]
  total: number
  courier: string | null
  tracking_number: string | null
  payment_status: string
  source: string | null
}

export default async function TrackPage({
  searchParams,
}: {
  searchParams: Promise<{ phone?: string; id?: string }>
}) {
  const { phone, id } = await searchParams

  let order: TrackedOrder | null = null
  let searched = false

  if (phone && id) {
    searched = true
    const supabase = await createClient()
    const { data } = await supabase.rpc("track_order", {
      p_phone: phone,
      p_order_id: id,
    })
    if (data && data.length > 0) {
      order = data[0] as TrackedOrder
    }
  }

  const shortId = order ? order.id.slice(0, 8).toUpperCase() : null

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <Package className="size-6 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Lacak Pesanan</h1>
          <p className="text-muted-foreground text-sm">
            Masukkan nomor WhatsApp dan ID pesanan untuk melihat status.
          </p>
        </div>
      </div>

      <form method="GET" className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Nomor WhatsApp</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            placeholder="Contoh: 08123456789"
            defaultValue={phone ?? ""}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="id">ID Pesanan</Label>
          <Input
            id="id"
            name="id"
            placeholder="8 karakter pertama, contoh: A1B2C3D4"
            defaultValue={id ?? ""}
            required
            minLength={8}
          />
          <p className="text-muted-foreground text-xs">
            ID pesanan ada di email atau pesan WhatsApp konfirmasi Anda.
          </p>
        </div>
        <Button type="submit" className="w-full">
          Cari Pesanan
        </Button>
      </form>

      {searched && !order && (
        <>
          <Separator className="my-8" />
          <p className="text-center text-sm text-muted-foreground">
            Pesanan tidak ditemukan. Pastikan nomor WhatsApp dan ID pesanan sudah benar.
          </p>
        </>
      )}

      {order && (
        <>
          <Separator className="my-8" />

          {order.source === "midtrans" && (
            <TrackPaymentPoller paymentStatus={order.payment_status} />
          )}

          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Pesanan</p>
              <p className="font-mono text-lg font-semibold">#{shortId}</p>
            </div>
            <div className="flex items-center gap-2">
              {order.source === "midtrans" && (() => {
                const p = PAYMENT_BADGE[order.payment_status] ?? PAYMENT_BADGE.unpaid
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
          </div>

          {/* Items */}
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Produk
            </h2>
            <div className="space-y-2">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span>
                    {item.name}{" "}
                    <span className="text-muted-foreground">×{item.quantity}</span>
                  </span>
                  <span className="tabular-nums font-medium">
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

          {/* Shipping */}
          {(order.courier || order.tracking_number) && (
            <div className="mb-6">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pengiriman
              </h2>
              <dl className="space-y-1.5 text-sm mb-3">
                {order.courier && (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-muted-foreground">Kurir</dt>
                    <dd>{order.courier}</dd>
                  </div>
                )}
                {order.tracking_number && (
                  <div className="flex gap-2">
                    <dt className="w-20 shrink-0 text-muted-foreground">No. Resi</dt>
                    <dd className="font-mono font-medium">{order.tracking_number}</dd>
                  </div>
                )}
              </dl>
              {order.courier && order.tracking_number && (
                <TrackingTimeline
                  courier={order.courier}
                  trackingNumber={order.tracking_number}
                />
              )}
            </div>
          )}
        </>
      )}
    </main>
  )
}
