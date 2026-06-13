import Link from "next/link"
import type { Metadata } from "next"

import { CheckoutForm } from "@/components/checkout-form"
import { CartIndicator } from "@/components/cart-indicator"
import { createClient } from "@/lib/supabase/server"
import type { BankAccount } from "@/lib/types"

export const metadata: Metadata = { title: "Checkout" }
export const dynamic = "force-dynamic"

async function getStoreSettings(): Promise<{
  phone: string
  greeting?: string
  bankAccounts: BankAccount[]
  cashPickupEnabled: boolean
  qrisMerchantString: string | null
}> {
  const fallback = process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER ?? "6281234567890"
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("store_settings")
      .select("whatsapp_number, checkout_message_template, bank_accounts, cash_pickup_enabled, qris_merchant_string")
      .maybeSingle()
    return {
      phone: data?.whatsapp_number ?? fallback,
      greeting: data?.checkout_message_template || undefined,
      bankAccounts: (data?.bank_accounts as BankAccount[] | null) ?? [],
      cashPickupEnabled: data?.cash_pickup_enabled ?? false,
      qrisMerchantString: data?.qris_merchant_string ?? null,
    }
  } catch {
    return { phone: fallback, bankAccounts: [], cashPickupEnabled: false, qrisMerchantString: null }
  }
}

export default async function CheckoutPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { phone, greeting, bankAccounts, cashPickupEnabled, qrisMerchantString } = await getStoreSettings()

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Checkout</h1>
        <div className="flex items-center gap-4">
          <Link href="/cart" className="text-muted-foreground text-sm hover:underline">
            ← Edit cart
          </Link>
          <CartIndicator />
        </div>
      </div>

      <CheckoutForm
        phone={phone}
        greeting={greeting}
        isLoggedIn={!!user}
        bankAccounts={bankAccounts}
        cashPickupEnabled={cashPickupEnabled}
        qrisMerchantString={qrisMerchantString}
      />
    </main>
  )
}
