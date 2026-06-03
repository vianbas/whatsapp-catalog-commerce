import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { WhatsappCheckoutButton } from "@/components/whatsapp-checkout-button";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { CartIndicator } from "@/components/cart-indicator";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import type { Product, StockStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STOCK_LABEL: Record<StockStatus, string> = {
  available: "Available",
  sold_out: "Sold out",
  preorder: "Pre-order",
};

async function getProduct(slug: string): Promise<{
  product: Product | null;
  whatsappNumber: string;
  greeting?: string;
}> {
  const fallbackNumber =
    process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER ?? "6281234567890";
  try {
    const supabase = await createClient();
    const [{ data: product }, { data: settings }] = await Promise.all([
      supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
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
      // Empty/absent template falls back to the default greeting in buildCheckoutUrl.
      greeting: settings?.checkout_message_template || undefined,
    };
  } catch {
    return { product: null, whatsappNumber: fallbackNumber };
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { product, whatsappNumber, greeting } = await getProduct(slug);

  if (!product) notFound();

  const cover = product.images[0];
  const hasDiscount =
    product.compare_at_price != null && product.compare_at_price > product.price;
  const soldOut = product.stock_status === "sold_out";

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/products"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Back to products
        </Link>
        <CartIndicator />
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="bg-muted relative aspect-square overflow-hidden rounded-lg">
          {cover ? (
            <Image
              src={cover}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              <Package className="size-16" aria-hidden />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <Badge variant="secondary" className="capitalize">
              {STOCK_LABEL[product.stock_status]}
            </Badge>
            <h1 className="text-2xl font-semibold tracking-tight">
              {product.name}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-2xl font-semibold">
              {formatRupiah(product.price)}
            </span>
            {hasDiscount && (
              <span className="text-muted-foreground text-lg line-through">
                {formatRupiah(product.compare_at_price!)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="text-muted-foreground whitespace-pre-line">
              {product.description}
            </p>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <AddToCartButton
              product={{
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: cover,
              }}
              disabled={soldOut}
              className="w-full sm:w-auto"
            />
            <WhatsappCheckoutButton
              phone={whatsappNumber}
              greeting={greeting}
              items={[{ name: product.name, price: product.price, quantity: 1 }]}
              disabled={soldOut}
              variant="outline"
              label={soldOut ? "Sold out" : "Order via WhatsApp"}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </div>
    </main>
  );
}
