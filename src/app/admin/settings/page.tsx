import type { Metadata } from "next";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createClient } from "@/lib/supabase/server";
import type { StoreSettings } from "@/lib/types";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Store settings</h1>
        <p className="text-muted-foreground text-sm">
          Configure how the storefront and WhatsApp checkout behave.
        </p>
      </div>

      <Alert>
        <AlertDescription>
          Editing &amp; persistence is wired up in a later step. Values below
          reflect the current configuration.
        </AlertDescription>
      </Alert>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-base">Storefront</CardTitle>
          <CardDescription>
            Public-facing store identity and contact.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store_name">Store name</Label>
            <Input
              id="store_name"
              defaultValue={settings?.store_name ?? "My Store"}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="whatsapp_number">WhatsApp number</Label>
            <Input
              id="whatsapp_number"
              defaultValue={settings?.whatsapp_number ?? fallbackNumber}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="store_description">Description</Label>
            <Textarea
              id="store_description"
              rows={3}
              defaultValue={settings?.store_description ?? ""}
              disabled
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
