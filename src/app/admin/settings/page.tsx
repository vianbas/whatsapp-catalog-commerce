import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StoreSettingsForm } from "@/components/store-settings-form";
import { createClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/lib/types";
import type { StoreSettingsInput } from "@/lib/validations/store-settings";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

async function getSettings(): Promise<StoreSettings | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("store_settings")
      .select("*")
      .maybeSingle();
    return (data as StoreSettings | null) ?? null;
  } catch {
    return null;
  }
}

export default async function AdminSettingsPage() {
  const settings = await getSettings();
  const fallbackNumber =
    process.env.NEXT_PUBLIC_STORE_WHATSAPP_NUMBER ?? "6281234567890";

  const defaultValues: StoreSettingsInput = {
    store_name: settings?.store_name ?? "My Store",
    store_description: settings?.store_description ?? "",
    whatsapp_number: settings?.whatsapp_number ?? fallbackNumber,
    currency: settings?.currency ?? "IDR",
    checkout_message_template: settings?.checkout_message_template ?? "",
    bank_accounts: settings?.bank_accounts ?? [],
    cash_pickup_enabled: settings?.cash_pickup_enabled ?? false,
    qris_merchant_string: settings?.qris_merchant_string ?? "",
    tracking_api_key: settings?.tracking_api_key ?? "",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Store settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure how the storefront and WhatsApp checkout behave.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Storefront</CardTitle>
          <CardDescription>
            Public-facing store identity and contact.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StoreSettingsForm defaultValues={defaultValues} />
        </CardContent>
      </Card>
    </div>
  );
}
