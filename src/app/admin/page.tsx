import Link from "next/link";
import type { Metadata } from "next";
import { Package, ShoppingBag, Tags } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

async function getStats(): Promise<{
  products: number;
  categories: number;
  orders: number;
}> {
  try {
    const supabase = await createClient();
    const [products, categories, orders] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
    ]);
    return {
      products: products.count ?? 0,
      categories: categories.count ?? 0,
      orders: orders.count ?? 0,
    };
  } catch {
    return { products: 0, categories: 0, orders: 0 };
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const cards = [
    { label: "Products", value: stats.products, icon: Package, href: "/admin/products" },
    { label: "Categories", value: stats.categories, icon: Tags, href: "/admin/categories" },
    { label: "Orders", value: stats.orders, icon: ShoppingBag, href: "/admin/orders" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Overview of your catalog.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">Add product</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon, href }) => (
          <Link key={label} href={href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-muted-foreground text-sm font-medium">
                  {label}
                </CardTitle>
                <Icon className="text-muted-foreground size-4" aria-hidden />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
