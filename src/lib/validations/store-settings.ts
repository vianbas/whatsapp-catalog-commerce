import { z } from "zod"

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
})

export type StoreSettingsInput = z.infer<typeof storeSettingsSchema>
