import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ProductForm } from "@/components/product-form";
import { updateProduct } from "@/app/admin/products/actions";
import { createClient } from "@/lib/supabase/server";
import type { ProductInput } from "@/lib/validations/product";
import type { Category, Product } from "@/lib/types";

export const metadata: Metadata = { title: "Edit product" };
export const dynamic = "force-dynamic";

async function getData(id: string): Promise<{
  product: Product | null;
  categories: Pick<Category, "id" | "name">[];
}> {
  try {
    const supabase = await createClient();
    const [{ data: product }, { data: categories }] = await Promise.all([
      supabase.from("products").select("*").eq("id", id).maybeSingle(),
      supabase
        .from("categories")
        .select("id, name")
        .order("sort_order", { ascending: true }),
    ]);
    return {
      product: (product as Product | null) ?? null,
      categories: categories ?? [],
    };
  } catch {
    return { product: null, categories: [] };
  }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { product, categories } = await getData(id);

  if (!product) notFound();

  const isLowStock =
    product.stock_quantity !== null &&
    product.stock_quantity <= 5 &&
    product.stock_status !== "sold_out";

  const defaults: Partial<ProductInput> = {
    name: product.name,
    slug: product.slug,
    description: product.description ?? "",
    category_id: product.category_id,
    price: product.price,
    compare_at_price: product.compare_at_price,
    images: product.images,
    stock_status: product.stock_status,
    is_featured: product.is_featured,
    is_active: product.is_active,
    sort_order: product.sort_order,
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Edit product
        </h1>
      </div>

      {isLowStock && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Low stock alert</p>
          <p className="mt-0.5">
            Only {product.stock_quantity} unit
            {product.stock_quantity !== 1 ? "s" : ""} remaining. Consider
            restocking soon.
          </p>
        </div>
      )}

      <ProductForm
        categories={categories}
        defaultValues={defaults}
        onSubmit={updateProduct.bind(null, product.id)}
        submitLabel="Save changes"
      />
    </div>
  );
}
