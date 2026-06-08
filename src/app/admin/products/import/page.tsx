import Link from "next/link"
import type { Metadata } from "next"

import { ImportForm } from "./import-form"

export const metadata: Metadata = { title: "Import products" }

export default function ImportProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/products"
          className="text-muted-foreground text-sm hover:underline"
        >
          ← Products
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          Import products
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Bulk-create products from a CSV file. Existing products are not
          overwritten.
        </p>
      </div>

      <ImportForm />
    </div>
  )
}
