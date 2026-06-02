"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import {
  storeSettingsSchema,
  type StoreSettingsInput,
} from "@/lib/validations/store-settings"

export type ActionResult = { error: string } | void

/** Map a validated payload to a `store_settings` row. */
function toRow(values: StoreSettingsInput) {
  return {
    store_name: values.store_name,
    store_description: values.store_description ? values.store_description : null,
    whatsapp_number: values.whatsapp_number,
    currency: values.currency,
    checkout_message_template: values.checkout_message_template
      ? values.checkout_message_template
      : null,
  }
}

/** Ensure the caller is authenticated before mutating (RLS is the real gate). */
async function requireSupabase() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/login")
  return supabase
}

export async function updateStoreSettings(
  values: StoreSettingsInput
): Promise<ActionResult> {
  const parsed = storeSettingsSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }

  const supabase = await requireSupabase()

  // store_settings is a singleton (unique `singleton` column). Upsert on that
  // column so this both creates the row the first time and updates it after.
  const { error } = await supabase
    .from("store_settings")
    .upsert({ singleton: true, ...toRow(parsed.data) }, { onConflict: "singleton" })
  if (error) return { error: error.message }

  // The WhatsApp number / store identity is read across the storefront.
  revalidatePath("/admin/settings")
  revalidatePath("/checkout")
  revalidatePath("/products/[slug]", "page")
}
