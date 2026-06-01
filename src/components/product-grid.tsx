import { PackageOpen } from "lucide-react"

import { ProductCard } from "@/components/product-card"
import type { Product } from "@/lib/types"

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16 text-center">
        <PackageOpen className="size-8" aria-hidden />
        <p className="text-sm">No products to show yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
