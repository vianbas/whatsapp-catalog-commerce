import Link from "next/link";
import type { Metadata } from "next";
import { Pencil, Plus, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteProductButton } from "@/components/delete-product-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import type { Product } from "@/lib/types";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    return (data as Product[] | null) ?? [];
  } catch {
    return [];
  }
}

export default async function AdminProductsPage() {
  const products = await getProducts();
  const lowStock = products.filter(
    (p) =>
      p.stock_quantity !== null &&
      p.stock_quantity <= 5 &&
      p.stock_status !== "sold_out"
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Products</h1>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/products/import">
              <Upload className="size-4" aria-hidden />
              Import CSV
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/products/new">
              <Plus className="size-4" aria-hidden />
              New product
            </Link>
          </Button>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Low stock alert</p>
          <ul className="mt-1 list-disc pl-4 space-y-0.5">
            {lowStock.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/admin/products/${p.id}/edit`}
                  className="underline underline-offset-2"
                >
                  {p.name}
                </Link>{" "}
                — {p.stock_quantity} unit{p.stock_quantity !== 1 ? "s" : ""} left
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-0 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  No products yet. Create your first one.
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{formatRupiah(product.price)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="capitalize">
                      {product.stock_status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={product.is_active ? "default" : "secondary"}>
                      {product.is_active ? "Active" : "Hidden"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon-sm">
                        <Link
                          href={`/admin/products/${product.id}/edit`}
                          aria-label={`Edit ${product.name}`}
                        >
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <DeleteProductButton id={product.id} name={product.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
