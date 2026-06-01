"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { ImageUploader } from "@/components/image-uploader"
import { productSchema, STOCK_STATUSES, type ProductInput } from "@/lib/validations/product"
import { slugify } from "@/lib/slug"
import type { Category } from "@/lib/types"

const STOCK_LABELS: Record<(typeof STOCK_STATUSES)[number], string> = {
  available: "Available",
  sold_out: "Sold out",
  preorder: "Pre-order",
}

const EMPTY_DEFAULTS: ProductInput = {
  name: "",
  slug: "",
  description: "",
  category_id: null,
  price: 0,
  compare_at_price: null,
  images: [],
  stock_status: "available",
  is_featured: false,
  is_active: true,
  sort_order: 0,
}

export function ProductForm({
  categories,
  defaultValues,
  onSubmit,
  submitLabel = "Save product",
}: {
  categories: Pick<Category, "id" | "name">[]
  defaultValues?: Partial<ProductInput>
  /** Wire to a Server Action in a later step. Defaults to a no-op preview. */
  onSubmit?: (values: ProductInput) => Promise<void> | void
  submitLabel?: string
}) {
  const [status, setStatus] = React.useState<string | null>(null)

  const form = useForm<ProductInput>({
    resolver: zodResolver(productSchema),
    defaultValues: { ...EMPTY_DEFAULTS, ...defaultValues },
  })

  async function handleSubmit(values: ProductInput) {
    setStatus(null)
    if (onSubmit) {
      await onSubmit(values)
      return
    }
    // Foundation step: persistence is not wired yet.
    setStatus("Validated. Saving is not wired up in this step yet.")
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="max-w-2xl space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Classic Cotton Tee"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e)
                    // Auto-fill slug while it hasn't been manually edited.
                    if (!form.getFieldState("slug").isDirty) {
                      form.setValue("slug", slugify(e.target.value))
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="slug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Slug</FormLabel>
              <FormControl>
                <Input placeholder="classic-cotton-tee" {...field} />
              </FormControl>
              <FormDescription>Used in the public product URL.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  rows={4}
                  placeholder="Soft 100% cotton t-shirt…"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (Rp)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    value={field.value ?? 0}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? 0 : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="compare_at_price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Compare-at price (Rp)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === "" ? null : Number(e.target.value)
                      )
                    }
                  />
                </FormControl>
                <FormDescription>Optional. Shown as a strikethrough.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select
                  value={field.value ?? undefined}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="stock_status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stock status</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STOCK_STATUSES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {STOCK_LABELS[value]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="images"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Images</FormLabel>
              <FormControl>
                <ImageUploader value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {submitLabel}
          </Button>
          {status && (
            <span className="text-muted-foreground text-sm">{status}</span>
          )}
        </div>
      </form>
    </Form>
  )
}
