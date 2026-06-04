import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderStatusSelect } from "@/components/order-status-select";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import type { Order } from "@/lib/types";

export const metadata: Metadata = { title: "Order" };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "long",
  timeStyle: "short",
});

async function getOrder(id: string): Promise<Order | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    return (data as Order | null) ?? null;
  } catch {
    return null;
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) notFound();

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/orders"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Orders
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            Order details
          </h1>
          <OrderStatusSelect id={order.id} status={order.status} />
        </div>
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-base">
            {dateFormatter.format(new Date(order.created_at))}
          </CardTitle>
          <p className="text-muted-foreground text-sm capitalize">
            Source: {order.source ?? "—"} · ID: {order.id}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Unit price</TableHead>
                <TableHead className="text-center">Qty</TableHead>
                <TableHead className="text-right">Line total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, i) => (
                <TableRow key={`${item.name}-${i}`}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-right">
                    {formatRupiah(item.price)}
                  </TableCell>
                  <TableCell className="text-center">{item.quantity}</TableCell>
                  <TableCell className="text-right">
                    {formatRupiah(item.price * item.quantity)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between border-t pt-4">
            <span className="text-sm font-medium">Total</span>
            <span className="text-lg font-semibold">
              {formatRupiah(order.total)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
