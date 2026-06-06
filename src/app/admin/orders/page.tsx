import Link from "next/link";
import type { Metadata } from "next";
import { Download } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { OrderStatusSelect } from "@/components/order-status-select";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function getOrders(): Promise<Order[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    return (data as Order[] | null) ?? [];
  } catch {
    return [];
  }
}

function itemsSummary(items: Order["items"]): string {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items.map((i) => `${i.name} ×${i.quantity}`).join(", ");
}

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm">
            WhatsApp checkout inquiries from the storefront.
          </p>
        </div>
        {orders.length > 0 && (
          <Button variant="outline" size="sm" asChild>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/admin/orders/export">
              <Download className="size-4" aria-hidden />
              Export CSV
            </a>
          </Button>
        )}
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Source</TableHead>
              <TableHead className="w-40">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  No orders yet.
                </TableCell>
              </TableRow>
            ) : (
              orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="font-medium hover:underline"
                    >
                      {dateFormatter.format(new Date(order.created_at))}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <span className="text-muted-foreground line-clamp-2 text-sm">
                      {itemsSummary(order.items)}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatRupiah(order.total)}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm capitalize">
                    {order.source ?? "—"}
                  </TableCell>
                  <TableCell>
                    <OrderStatusSelect id={order.id} status={order.status} />
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
