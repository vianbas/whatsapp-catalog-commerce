import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { WhatsappCheckoutButton } from "@/components/whatsapp-checkout-button";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { CartIndicator } from "@/components/cart-indicator";
import { ProductGallery } from "@/components/product-gallery";
import { ProductCard } from "@/components/product-card";
import { ProductReviews } from "@/components/product-reviews";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import type { Product, ProductReview, StockStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

/** Lightweight fetch for metadata (separate from the full page query). */
async function getProductMeta(
  slug: string
): Promise<Pick<Product, "name" | "description" | "images"> | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("name, description, images")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    return (data as Pick<Product, "name" | "description" | "images"> | null) ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductMeta(slug);
  if (!product) return { title: "Product not found" };

  const description =
    product.description?.slice(0, 200) ??
    `${product.name} — order via WhatsApp.`;
  const image = product.images[0];

  return {
    title: product.name,
    description,
    openGraph: {
      title: product.name,
      description,
      type: "website",
      ...(image ? { images: [{ url: image }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: product.name,
      description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

const STOCK_LABEL: Record<StockStatus, string> = {
  available: "Available",
  sold_out: "Sold out",
  preorder: "Pre-order",
};

async function getRelatedProducts(
  categoryId: string,
  excludeId: string
): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .eq("is_active", true)
      .neq("id", excludeId)
      .limit(4);
    return (data as Product[] | null) ?? [];
  } catch {
    return [];
  }
}

async function getReviews(productId: string): Promise<ProductReview[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("product_reviews")
      .select("*")
      .eq("product_id", productId)
      .eq("is_approved", true)
      .order("created_at", { ascending: false });
    return (data as ProductReview[] | null) ?? [];
  } catch {
    return [];
  }
}

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

  const [relatedProducts, reviews] = await Promise.all([
    product.category_id
      ? getRelatedProducts(product.category_id, product.id)
      : Promise.resolve([]),
    getReviews(product.id),
  ]);

  const cover = product.images[0];
  const hasDiscount =
    product.compare_at_price != null && product.compare_at_price > product.price;
  const soldOut = product.stock_status === "sold_out";

  const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const AVAILABILITY: Record<string, string> = {
    available: "https://schema.org/InStock",
    sold_out: "https://schema.org/OutOfStock",
    preorder: "https://schema.org/PreOrder",
  };
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.description ? { description: product.description } : {}),
    ...(product.images.length > 0 ? { image: product.images } : {}),
    ...(BASE ? { url: `${BASE}/products/${product.slug}` } : {}),
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "IDR",
      availability: AVAILABILITY[product.stock_status] ?? "https://schema.org/InStock",
    },
  };

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />
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
        <ProductGallery images={product.images} alt={product.name} />

        <div className="space-y-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="capitalize">
                {STOCK_LABEL[product.stock_status]}
              </Badge>
              {product.stock_quantity != null &&
                product.stock_quantity > 0 &&
                product.stock_quantity <= 10 && (
                  <span className="text-destructive text-xs font-medium">
                    Only {product.stock_quantity} left
                  </span>
                )}
            </div>
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
              recordOrder
              source="product"
              items={[{ name: product.name, price: product.price, quantity: 1, product_id: product.id }]}
              disabled={soldOut}
              variant="outline"
              label={soldOut ? "Sold out" : "Order via WhatsApp"}
              className="w-full sm:w-auto"
            />
          </div>
        </div>
      </div>

      <ProductReviews productId={product.id} initialReviews={reviews} />

      {relatedProducts.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-4 text-lg font-semibold tracking-tight">
            You may also like
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
