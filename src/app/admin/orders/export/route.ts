import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Order } from "@/lib/types";

function cell(value: string | number | null | undefined): string {
  const s = String(value ?? "");
  return s.includes(",") || s.includes('"') || s.includes("\n")
    ? `"${s.replace(/"/g, '""')}"`
    : s;
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });

  const orders = (data as Order[] | null) ?? [];

  const header = ["ID", "Date", "Items", "Total (IDR)", "Source", "Status"].join(",");

  const rows = orders.map((order) => {
    const items = Array.isArray(order.items)
      ? order.items.map((i) => `${i.name} x${i.quantity}`).join("; ")
      : "";
    return [
      cell(order.id),
      cell(order.created_at),
      cell(items),
      cell(order.total),
      cell(order.source),
      cell(order.status),
    ].join(",");
  });

  const csv = [header, ...rows].join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="orders.csv"',
    },
  });
}
