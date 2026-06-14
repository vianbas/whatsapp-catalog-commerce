"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { updateStoreSettings } from "@/app/admin/settings/actions"
import {
  storeSettingsSchema,
  type StoreSettingsInput,
} from "@/lib/validations/store-settings"

export function StoreSettingsForm({
  defaultValues,
}: {
  defaultValues: StoreSettingsInput
}) {
  const router = useRouter()
  const [error, setError] = React.useState<string | null>(null)
  const [saved, setSaved] = React.useState(false)

  const form = useForm<StoreSettingsInput>({
    resolver: zodResolver(storeSettingsSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "bank_accounts",
  })

  async function handleSubmit(values: StoreSettingsInput) {
    setError(null)
    setSaved(false)
    try {
      const result = await updateStoreSettings(values)
      if (result?.error) {
        setError(result.error)
        return
      }
      setSaved(true)
      form.reset(values)
      router.refresh()
    } catch {
      setError("Something went wrong while saving. Please try again.")
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="max-w-2xl space-y-6"
      >
        {/* ── Store identity ── */}
        <FormField
          control={form.control}
          name="store_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Store name</FormLabel>
              <FormControl>
                <Input placeholder="My Store" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="whatsapp_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>WhatsApp number</FormLabel>
                <FormControl>
                  <Input placeholder="6281234567890" {...field} />
                </FormControl>
                <FormDescription>
                  International format; checkout links normalize it.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Currency</FormLabel>
                <FormControl>
                  <Input maxLength={3} placeholder="IDR" {...field} />
                </FormControl>
                <FormDescription>3-letter ISO code (e.g. IDR).</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="store_description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="checkout_message_template"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Checkout message template</FormLabel>
              <FormControl>
                <Textarea
                  rows={3}
                  placeholder="Halo, saya ingin memesan:"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Optional greeting prepended to the WhatsApp order message.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* ── Bank transfer ── */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium">Bank transfer accounts</h3>
            <p className="text-muted-foreground text-xs mt-0.5">
              Add one or more accounts. When at least one is saved, buyers will see a
              &ldquo;Bank Transfer&rdquo; option at checkout.
            </p>
          </div>

          {fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-lg border p-4 sm:grid-cols-3"
            >
              <FormField
                control={form.control}
                name={`bank_accounts.${index}.bank`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Bank name</FormLabel>
                    <FormControl>
                      <Input placeholder="BCA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`bank_accounts.${index}.account_number`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Account number</FormLabel>
                    <FormControl>
                      <Input placeholder="1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`bank_accounts.${index}.account_holder`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Account holder</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="sm:col-span-3 flex justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="size-3.5 mr-1" aria-hidden />
                  Remove
                </Button>
              </div>
            </div>
          ))}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ bank: "", account_number: "", account_holder: "" })}
          >
            <Plus className="size-3.5 mr-1" aria-hidden />
            Add bank account
          </Button>
        </div>

        <Separator />

        {/* ── Cash pickup ── */}
        <FormField
          control={form.control}
          name="cash_pickup_enabled"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center gap-3">
                <FormControl>
                  <input
                    type="checkbox"
                    id="cash_pickup_enabled"
                    checked={field.value}
                    onChange={field.onChange}
                    className="size-4 rounded border-gray-300 accent-primary"
                  />
                </FormControl>
                <div>
                  <FormLabel htmlFor="cash_pickup_enabled" className="cursor-pointer">
                    Enable cash pickup / bayar di toko
                  </FormLabel>
                  <FormDescription>
                    When enabled, buyers see a &ldquo;Cash Pickup&rdquo; option at checkout.
                  </FormDescription>
                </div>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator />

        {/* ── QRIS ── */}
        <div>
          <h3 className="text-sm font-medium">Pembayaran QRIS</h3>
          <p className="text-muted-foreground text-xs mt-0.5">
            Tempel string QRIS statis dari aplikasi GoPay/OVO/Dana/m-banking Anda.
            Aplikasi akan otomatis membuat kode QR dinamis dengan nominal yang tepat saat checkout.
          </p>
        </div>

        <FormField
          control={form.control}
          name="qris_merchant_string"
          render={({ field }) => (
            <FormItem>
              <FormLabel>String merchant QRIS</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="000201010212..."
                  className="font-mono text-xs"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormDescription>
                Kosongkan jika tidak menggunakan QRIS. Hanya string EMV QCO (mulai dengan 000201).
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Save settings
          </Button>
          {saved && (
            <span className="text-sm text-emerald-600">Saved.</span>
          )}
          {error && <span className="text-destructive text-sm">{error}</span>}
        </div>
      </form>
    </Form>
  )
}
