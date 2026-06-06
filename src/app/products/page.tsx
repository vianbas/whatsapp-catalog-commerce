import Link from "next/link";
import type { Metadata } from "next";

import { CategoryFilter } from "@/components/category-filter";
import { ProductGrid } from "@/components/product-grid";
import { CartIndicator } from "@/components/cart-indicator";
import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

export const metadata: Metadata = { title: "Products" };

// Reads cookies + DB per request.
export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

async function getCatalog(
  categorySlug: string | undefined,
  q: string | undefined,
  page: number
): Promise<{
  categories: Pick<Category, "id" | "name" | "slug">[];
  products: Product[];
  total: number;
}> {
  try {
    const supabase = await createClient();

    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, slug")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    const from = (page - 1) * PAGE_SIZE;
    let query = supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    if (categorySlug) {
      const match = categories?.find((c) => c.slug === categorySlug);
      // Unknown category → no results rather than the full catalog.
      query = query.eq(
        "category_id",
        match?.id ?? "00000000-0000-0000-0000-000000000000"
      );
    }

    if (q) query = query.ilike("name", `%${q}%`);

    const { data: products, count } = await query;

    return {
      categories: categories ?? [],
      products: (products as Product[] | null) ?? [],
      total: count ?? 0,
    };
  } catch {
    // DB not configured yet (e.g. local build without env) — render empty.
    return { categories: [], products: [], total: 0 };
  }
}

function pageHref(page: number, category?: string, q?: string): string {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/products${qs ? `?${qs}` : ""}`;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string; page?: string }>;
}) {
  const { category, q, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const { categories, products, total } = await getCatalog(category, q, page);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

      <div className="mb-4">
        <SearchBar defaultQuery={q ?? ""} category={category} />
      </div>

      <div className="mb-6">
        <CategoryFilter categories={categories} activeSlug={category} />
      </div>

      {q && (
        <p className="text-muted-foreground mb-4 text-sm">
          {total} result{total === 1 ? "" : "s"} for &ldquo;{q}&rdquo;
        </p>
      )}

      <ProductGrid products={products} />

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between">
          <Button
            asChild={page > 1}
            variant="outline"
            size="sm"
            disabled={page <= 1}
          >
            {page > 1 ? (
              <Link href={pageHref(page - 1, category, q)}>← Previous</Link>
            ) : (
              <span>← Previous</span>
            )}
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            asChild={page < totalPages}
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
          >
            {page < totalPages ? (
              <Link href={pageHref(page + 1, category, q)}>Next →</Link>
            ) : (
              <span>Next →</span>
            )}
          </Button>
        </div>
      )}
    </main>
  );
}
