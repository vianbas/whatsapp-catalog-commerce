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
import { Input } from "@/components/ui/input";
import { OrderStatusSelect } from "@/components/order-status-select";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import type { Order, OrderStatus } from "@/lib/types";

export const metadata: Metadata = { title: "Orders" };
export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = ["new", "contacted", "completed", "cancelled"];

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
});

async function getOrders(status?: OrderStatus, q?: string): Promise<Order[]> {
  try {
    const supabase = await createClient();
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (status) query = query.eq("status", status);
    const { data } = await query;
    let orders = (data as Order[] | null) ?? [];

    // Search by customer name / phone / order ID. Filtered in-memory (the page
    // already loads the full set); matches the displayed short id (first 8 of
    // the UUID) and the full UUID by ignoring dashes/case. If order volume
    // grows, move this to a DB-side search (trigram index or an RPC).
    if (q) {
      const needle = q.trim().toLowerCase();
      const idNeedle = needle.replace(/-/g, "");
      orders = orders.filter((o) => {
        const name = (o.customer_name ?? "").toLowerCase();
        const phone = (o.customer_phone ?? "").toLowerCase();
        const id = o.id.toLowerCase().replace(/-/g, "");
        return (
          name.includes(needle) ||
          phone.includes(needle) ||
          id.includes(idNeedle)
        );
      });
    }

    return orders;
  } catch {
    return [];
  }
}

function itemsSummary(items: Order["items"]): string {
  if (!Array.isArray(items) || items.length === 0) return "—";
  return items.map((i) => `${i.name} ×${i.quantity}`).join(", ");
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status: statusParam, q: qParam } = await searchParams;
  const status = STATUSES.includes(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : undefined;
  const q = qParam?.trim() || undefined;
  const orders = await getOrders(status, q);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Orders</h1>
          <p className="text-muted-foreground text-sm">
            {q ? (
              <>Search results for <span className="font-medium">“{q}”</span>{status ? <> in <span className="capitalize font-medium">{status}</span></> : null} — <Link href={status ? `/admin/orders?status=${status}` : "/admin/orders"} className="underline">clear</Link></>
            ) : status ? (
              <>Filtered by <span className="capitalize font-medium">{status}</span> — <Link href="/admin/orders" className="underline">clear</Link></>
            ) : (
              "WhatsApp checkout inquiries from the storefront."
            )}
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

      <form method="GET" className="flex gap-2">
        {status && <input type="hidden" name="status" value={status} />}
        <Input
          name="q"
          type="search"
          placeholder="Search by name, phone, or order ID…"
          defaultValue={q ?? ""}
          className="max-w-sm"
        />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>

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
                  {q ? "No orders match your search." : "No orders yet."}
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
