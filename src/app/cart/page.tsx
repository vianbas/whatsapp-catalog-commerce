import Link from "next/link";
import type { Metadata } from "next";

import { CartView } from "@/components/cart-view";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cart" };
export const dynamic = "force-dynamic";

async function getStoreContact(): Promise<{
  phone: string;
  greeting?: string;
}> {
  const fallbackNumber =
    process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER ?? "6281234567890";
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("whatsapp_number, checkout_message_template")
      .maybeSingle();
    return {
      phone: data?.whatsapp_number ?? fallbackNumber,
      greeting: data?.checkout_message_template || undefined,
    };
  } catch {
    return { phone: fallbackNumber };
  }
}

export default async function CartPage() {
  const { phone, greeting } = await getStoreContact();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your cart</h1>
        <Link
          href="/products"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Continue shopping
        </Link>
      </div>

      <CartView phone={phone} greeting={greeting} />
    </main>
  );
}
