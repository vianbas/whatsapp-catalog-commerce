import Link from "next/link";
import type { Metadata } from "next";
import { Package, ShoppingBag, Tags, DollarSign } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "New",
  contacted: "Contacted",
  completed: "Completed",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  new: "default",
  contacted: "secondary",
  completed: "outline",
  cancelled: "destructive",
};

async function getStats(): Promise<{
  products: number;
  categories: number;
  orders: number;
  revenue: number;
  byStatus: Record<OrderStatus, number>;
}> {
  const empty = {
    products: 0,
    categories: 0,
    orders: 0,
    revenue: 0,
    byStatus: { new: 0, contacted: 0, completed: 0, cancelled: 0 },
  };

  try {
    const supabase = await createClient();
    const [products, categories, ordersRes] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("categories").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("status, total"),
    ]);

    const orders = (ordersRes.data ?? []) as { status: OrderStatus; total: number }[];
    const revenue = orders.reduce((sum, o) => sum + o.total, 0);
    const byStatus: Record<OrderStatus, number> = { new: 0, contacted: 0, completed: 0, cancelled: 0 };
    for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

    return {
      products: products.count ?? 0,
      categories: categories.count ?? 0,
      orders: orders.length,
      revenue,
      byStatus,
    };
  } catch {
    return empty;
  }
}

export default async function AdminDashboardPage() {
  const stats = await getStats();

  const countCards = [
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

      {/* Count cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {countCards.map(({ label, value, icon: Icon, href }) => (
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

      {/* Revenue card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-muted-foreground text-sm font-medium">
            Total Revenue
          </CardTitle>
          <DollarSign className="text-muted-foreground size-4" aria-hidden />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold">{formatRupiah(stats.revenue)}</div>
          <p className="text-muted-foreground mt-1 text-xs">
            Across all {stats.orders} order{stats.orders === 1 ? "" : "s"}
          </p>
        </CardContent>
      </Card>

      {/* Order status breakdown */}
      <div>
        <h2 className="mb-3 text-sm font-medium">Orders by status</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          {(Object.keys(STATUS_LABELS) as OrderStatus[]).map((status) => (
            <Link key={status} href={`/admin/orders?status=${status}`}>
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="flex items-center justify-between pt-4 pb-4">
                  <Badge variant={STATUS_VARIANT[status]}>
                    {STATUS_LABELS[status]}
                  </Badge>
                  <span className="text-xl font-semibold">
                    {stats.byStatus[status]}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
