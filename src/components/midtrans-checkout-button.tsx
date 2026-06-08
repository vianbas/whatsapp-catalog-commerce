"use client"

import * as React from "react"
import { CreditCard } from "lucide-react"

import { Button } from "@/components/ui/button"

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options: {
          onSuccess: (result: unknown) => void
          onPending: (result: unknown) => void
          onError: (result: unknown) => void
          onClose: () => void
        }
      ) => void
    }
  }
}

const CLIENT_KEY = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ?? ""
const IS_PRODUCTION = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
const SNAP_JS_URL = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/snap.js"
  : "https://app.sandbox.midtrans.com/snap/snap.js"

interface MidtransCheckoutButtonProps {
  onClick: () => void
  disabled?: boolean
}

export function MidtransCheckoutButton({ onClick, disabled }: MidtransCheckoutButtonProps) {
  const [snapReady, setSnapReady] = React.useState(false)

  React.useEffect(() => {
    if (!CLIENT_KEY) return

    if (window.snap) {
      // snap.js already loaded by a previous mount — schedule state update
      const id = setTimeout(() => setSnapReady(true), 0)
      return () => clearTimeout(id)
    }

    const script = document.createElement("script")
    script.src = SNAP_JS_URL
    script.setAttribute("data-client-key", CLIENT_KEY)
    script.onload = () => setSnapReady(true)
    document.body.appendChild(script)

    return () => {
      document.body.removeChild(script)
    }
  }, [])

  if (!CLIENT_KEY) return null

  return (
    <Button
      type="button"
      className="w-full"
      size="lg"
      onClick={onClick}
      disabled={disabled || !snapReady}
    >
      <CreditCard className="size-4" aria-hidden />
      {snapReady ? "Pay Online" : "Loading payment…"}
    </Button>
  )
}
