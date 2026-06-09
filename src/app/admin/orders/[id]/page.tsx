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
import { OrderTrackingForm } from "@/components/order-tracking-form";
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
          {order.source === "midtrans" && (
            <p className="text-sm">
              <span className="text-muted-foreground">Payment: </span>
              <span className={
                order.payment_status === "paid"
                  ? "font-medium text-green-700 dark:text-green-400"
                  : order.payment_status === "failed"
                    ? "font-medium text-destructive"
                    : order.payment_status === "pending"
                      ? "font-medium text-yellow-700 dark:text-yellow-400"
                      : "text-muted-foreground"
              }>
                {order.payment_status}
                {order.payment_type ? ` · ${order.payment_type}` : ""}
              </span>
            </p>
          )}
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

          {(order.customer_name || order.customer_phone || order.customer_address || order.notes) && (
            <div className="border-t pt-4 space-y-1.5 text-sm">
              <p className="font-medium">Customer details</p>
              {order.customer_name && (
                <p><span className="text-muted-foreground">Name: </span>{order.customer_name}</p>
              )}
              {order.customer_phone && (
                <p><span className="text-muted-foreground">Phone: </span>{order.customer_phone}</p>
              )}
              {order.customer_address && (
                <p><span className="text-muted-foreground">Address: </span>{order.customer_address}</p>
              )}
              {order.notes && (
                <p><span className="text-muted-foreground">Notes: </span>{order.notes}</p>
              )}
            </div>
          )}

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Shipping tracking</p>
            {(order.courier || order.tracking_number) && (
              <div className="text-sm space-y-1 mb-3">
                {order.courier && (
                  <p><span className="text-muted-foreground">Courier: </span>{order.courier}</p>
                )}
                {order.tracking_number && (
                  <p><span className="text-muted-foreground">Tracking no.: </span>
                    <span className="font-mono">{order.tracking_number}</span>
                  </p>
                )}
              </div>
            )}
            <OrderTrackingForm
              orderId={order.id}
              courier={order.courier}
              trackingNumber={order.tracking_number}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
