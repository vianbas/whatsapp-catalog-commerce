import type { Metadata } from "next";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DiscountFormDialog } from "@/components/discount-form-dialog";
import { DiscountActions } from "@/components/discount-actions";
import { createClient } from "@/lib/supabase/server";
import { formatRupiah } from "@/lib/utils";
import type { DiscountCode } from "@/lib/types";

export const metadata: Metadata = { title: "Discount Codes" };
export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" });

async function getCodes(): Promise<DiscountCode[]> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .order("created_at", { ascending: false });
    return (data as DiscountCode[] | null) ?? [];
  } catch {
    return [];
  }
}

function formatValue(code: DiscountCode): string {
  return code.type === "percent"
    ? `${code.value}%`
    : formatRupiah(code.value);
}

export default async function AdminDiscountsPage() {
  const codes = await getCodes();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Discount Codes
          </h1>
          <p className="text-muted-foreground text-sm">
            Promo codes customers can apply at checkout.
          </p>
        </div>
        <DiscountFormDialog />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Uses</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-0 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {codes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-muted-foreground py-10 text-center text-sm"
                >
                  No discount codes yet.
                </TableCell>
              </TableRow>
            ) : (
              codes.map((code) => (
                <TableRow key={code.id}>
                  <TableCell className="font-mono font-medium">
                    {code.code}
                  </TableCell>
                  <TableCell>{formatValue(code)}</TableCell>
                  <TableCell>
                    {code.uses}
                    {code.max_uses != null && (
                      <span className="text-muted-foreground">
                        {" "}/ {code.max_uses}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {code.expires_at
                      ? dateFormatter.format(new Date(code.expires_at))
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={code.is_active ? "default" : "secondary"}>
                      {code.is_active ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DiscountActions
                      id={code.id}
                      code={code.code}
                      isActive={code.is_active}
                    />
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
