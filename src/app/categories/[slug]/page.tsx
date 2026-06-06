import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { ProductGrid } from "@/components/product-grid";
import { CartIndicator } from "@/components/cart-indicator";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

async function getCategoryPage(
  slug: string,
  page: number
): Promise<{
  category: Category;
  products: Product[];
  total: number;
} | null> {
  try {
    const supabase = await createClient();

    const { data: category } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();

    if (!category) return null;

    const from = (page - 1) * PAGE_SIZE;
    const { data: products, count } = await supabase
      .from("products")
      .select("*", { count: "exact" })
      .eq("is_active", true)
      .eq("category_id", category.id)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .range(from, from + PAGE_SIZE - 1);

    return {
      category: category as Category,
      products: (products as Product[] | null) ?? [],
      total: count ?? 0,
    };
  } catch {
    return null;
  }
}

function pageHref(slug: string, page: number): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/categories/${slug}${qs ? `?${qs}` : ""}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("name, description")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return {
    title: data?.name ?? "Category",
    description: data?.description ?? undefined,
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const [{ slug }, { page: pageParam }] = await Promise.all([
    params,
    searchParams,
  ]);
  const page = Math.max(1, Number(pageParam) || 1);
  const data = await getCategoryPage(slug, page);

  if (!data) notFound();

  const { category, products, total } = data;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {category.name}
          </h1>
          {category.description && (
            <p className="text-muted-foreground mt-1 text-sm">
              {category.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="text-muted-foreground text-sm hover:underline"
          >
            ← All products
          </Link>
          <CartIndicator />
        </div>
      </div>

      <p className="text-muted-foreground mb-6 text-sm">
        {total} product{total === 1 ? "" : "s"}
      </p>

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
              <Link href={pageHref(slug, page - 1)}>← Previous</Link>
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
              <Link href={pageHref(slug, page + 1)}>Next →</Link>
            ) : (
              <span>Next →</span>
            )}
          </Button>
        </div>
      )}
    </main>
  );
}
