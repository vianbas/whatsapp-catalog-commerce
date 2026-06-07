import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "My Orders" };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

const STATUS_VARIANT: Record<
  Order["status"],
  "default" | "secondary" | "outline"
> = {
  new: "default",
  contacted: "secondary",
  completed: "outline",
  cancelled: "outline",
};

function itemsSummary(items: Order["items"]): string {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items.map((i) => `${i.name} ×${i.quantity}`).join(", ");
}

export default async function CustomerOrdersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("orders")
    .select("*")
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  const orders = (data as Order[] | null) ?? [];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Orders</h1>
          <p className="text-muted-foreground text-sm">
            Your WhatsApp checkout history.
          </p>
        </div>
        <Link
          href="/products"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Back to products
        </Link>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  No orders yet.{" "}
                  <Link href="/products" className="underline">
                    Browse the catalog
                  </Link>
                  .
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id} className="cursor-pointer">
                  <TableCell className="whitespace-nowrap text-sm">
                    <Link href={`/orders/${order.id}`} className="hover:underline">
                      {dateFormatter.format(new Date(order.created_at))}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs text-sm">
                    <Link href={`/orders/${order.id}`} className="line-clamp-2 hover:underline">
                      {itemsSummary(order.items)}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/orders/${order.id}`} className="hover:underline">
                      {formatRupiah(order.total)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/orders/${order.id}`}>
                      <Badge
                        variant={STATUS_VARIANT[order.status]}
                        className="capitalize"
                      >
                        {order.status}
                      </Badge>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </main>
  );
}
