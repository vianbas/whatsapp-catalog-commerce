import Link from "next/link";
import type { Metadata } from "next";

import { CategoryFilter } from "@/components/category-filter";
import { ProductGrid } from "@/components/product-grid";
import { CartIndicator } from "@/components/cart-indicator";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

export const metadata: Metadata = { title: "Products" };

// Reads cookies + DB per request.
export const dynamic = "force-dynamic";

async function getCatalog(categorySlug?: string): Promise<{
  categories: Pick<Category, "id" | "name" | "slug">[];
  products: Product[];
}> {
  try {
    const supabase = await createClient();

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    let query = supabase
      .from("products")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (categorySlug) {
      const match = categories?.find((c) => c.slug === categorySlug);
      // Unknown category → no results rather than the full catalog.
      query = query.eq("category_id", match?.id ?? "00000000-0000-0000-0000-000000000000");
    }

    const { data: products } = await query;

    return {
      categories: categories ?? [],
      products: (products as Product[] | null) ?? [],
    };
  } catch {
    // DB not configured yet (e.g. local build without env) — render empty.
    return { categories: [], products: [] };
  }
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const { categories, products } = await getCatalog(category);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
          <p className="text-muted-foreground text-sm">
            Browse the catalog and order via WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="text-muted-foreground text-sm hover:underline"
          >
            ← Home
          </Link>
          <CartIndicator />
        </div>
      </div>

      <div className="mb-6">
        <CategoryFilter categories={categories} activeSlug={category} />
      </div>

      <ProductGrid products={products} />
    </main>
  );
}
