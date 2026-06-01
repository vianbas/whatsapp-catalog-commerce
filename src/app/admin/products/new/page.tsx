import Link from "next/link";
import type { Metadata } from "next";

import { ProductForm } from "@/components/product-form";
import { createProduct } from "@/app/admin/products/actions";
import { createClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";

export const metadata: Metadata = { title: "New product" };
export const dynamic = "force-dynamic";

async function getCategories(): Promise<Pick<Category, "id" | "name">[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("categories")
      .select("id, name")
      .order("sort_order", { ascending: true });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function NewProductPage() {
  const categories = await getCategories();

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
          New product
        </h1>
      </div>

      <ProductForm
        categories={categories}
        onSubmit={createProduct}
        submitLabel="Create product"
      />
    </div>
  );
}
