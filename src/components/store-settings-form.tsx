"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

        <div className="flex items-center gap-3">
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
