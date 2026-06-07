import Link from "next/link";
import type { Metadata } from "next";
import { MessageCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WhatsappCheckoutButton } from "@/components/whatsapp-checkout-button";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Checkout" };
export const dynamic = "force-dynamic";

async function getCheckout(productSlug?: string): Promise<{
  product: Product | null;
  whatsappNumber: string;
  greeting?: string;
}> {
  const fallbackNumber =
    process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER ?? "6281234567890";
  if (!productSlug) return { product: null, whatsappNumber: fallbackNumber };

  try {
    const supabase = await createClient();
    const [{ data: product }, { data: settings }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("slug", productSlug)
        .eq("is_active", true)
        .maybeSingle(),
      supabase
        .from("store_settings")
        .select("whatsapp_number, checkout_message_template")
        .maybeSingle(),
    ]);
    return {
      product: (product as Product | null) ?? null,
      whatsappNumber: settings?.whatsapp_number ?? fallbackNumber,
      greeting: settings?.checkout_message_template || undefined,
    };
  } catch {
    return { product: null, whatsappNumber: fallbackNumber };
  }
}

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; qty?: string }>;
}) {
  const { product: productSlug, qty } = await searchParams;
  const quantity = Math.max(1, Number(qty) || 1);
  const { product, whatsappNumber, greeting } = await getCheckout(productSlug);

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-12">
      <h1 className="mb-1 text-2xl font-semibold tracking-tight">Checkout</h1>
      <p className="text-muted-foreground mb-8 text-sm">
        Orders are completed in a WhatsApp conversation with the store.
      </p>

      {product ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>
                {product.name} <span className="text-muted-foreground">×{quantity}</span>
              </span>
              <span className="font-medium">
                {formatRupiah(product.price * quantity)}
              </span>
            </div>
            <div className="flex items-center justify-between border-t pt-3 text-sm font-semibold">
              <span>Total</span>
              <span>{formatRupiah(product.price * quantity)}</span>
            </div>
            <WhatsappCheckoutButton
              phone={whatsappNumber}
              greeting={greeting}
              recordOrder
              source="checkout"
              items={[
                { name: product.name, price: product.price, quantity, product_id: product.id },
              ]}
              className="w-full"
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <MessageCircle className="text-muted-foreground size-8" aria-hidden />
            <p className="text-muted-foreground text-sm">
              No item selected. Pick a product from the catalog to start an
              order.
            </p>
            <Link href="/products" className="text-sm font-medium hover:underline">
              Browse products →
            </Link>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
