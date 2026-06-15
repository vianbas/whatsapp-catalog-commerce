import { z } from "zod"

const bankAccountSchema = z.object({
  bank: z.string().trim().min(1, "Bank name required").max(60),
  account_number: z.string().trim().min(1, "Account number required").max(30),
  account_holder: z.string().trim().min(1, "Account holder required").max(120),
})

export const storeSettingsSchema = z.object({
  store_name: z.string().trim().min(1, "Store name is required").max(120),
  store_description: z.string().trim().max(2000).optional().or(z.literal("")),
  /**
   * Accepts any human-entered phone format; normalization to the `wa.me`
   * digits-only form happens in `lib/whatsapp.ts` at link-build time.
   */
  whatsapp_number: z
    .string()
    .trim()
    .min(8, "Enter a valid WhatsApp number")
    .regex(/^[+0-9\s()-]+$/, "Only digits and phone separators are allowed"),
  // No .default() so the schema's input and output types match (required for
  // the RHF zodResolver); the form supplies "IDR" as the default value.
  currency: z.string().trim().length(3),
  checkout_message_template: z
    .string()
    .trim()
    .max(1000)
    .optional()
    .or(z.literal("")),
  bank_accounts: z.array(bankAccountSchema),
  cash_pickup_enabled: z.boolean(),
  // Seller pastes their static QRIS string once; the app builds dynamic QRs
  // with the transaction amount at checkout.
  qris_merchant_string: z
    .string()
    .trim()
    .max(1024)
    .optional()
    .or(z.literal("")),
  // Binderbyte API key for live expedition tracking on /track and /orders/[id].
  tracking_api_key: z
    .string()
    .trim()
    .max(256)
    .optional()
    .or(z.literal("")),
})

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>
