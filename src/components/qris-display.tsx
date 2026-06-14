"use client"

import * as React from "react"

import { buildDynamicQris } from "@/lib/qris"
import { formatRupiah } from "@/lib/utils"

interface QrisDisplayProps {
  merchantString: string
  amount: number
}

export function QrisDisplay({ merchantString, amount }: QrisDisplayProps) {
  const [dataUrl, setDataUrl] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false

    async function generate() {
      try {
        const dynamicQris = buildDynamicQris(merchantString, amount)
        // Dynamic import keeps qrcode out of the initial bundle
        const QRCode = (await import("qrcode")).default
        const url = await QRCode.toDataURL(dynamicQris, {
          errorCorrectionLevel: "M",
          width: 280,
          margin: 2,
        })
        if (!cancelled) setDataUrl(url)
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Gagal membuat kode QR")
      }
    }

    generate()
    return () => {
      cancelled = true
    }
  }, [merchantString, amount])

  if (error) {
    return <p className="text-destructive text-center text-sm">{error}</p>
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt="Kode QR QRIS"
          width={280}
          height={280}
          className="rounded-lg border"
        />
      ) : (
        <div className="flex h-[280px] w-[280px] items-center justify-center rounded-lg border">
          <span className="text-muted-foreground text-sm">Memuat kode QR…</span>
        </div>
      )}
      <p className="text-muted-foreground text-center text-xs">
        Total: <span className="text-foreground font-semibold">{formatRupiah(amount)}</span>
        {" "}— scan dengan GoPay, OVO, Dana, atau aplikasi m-banking.
      </p>
    </div>
  )
}
