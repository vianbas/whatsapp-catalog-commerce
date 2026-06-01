import Image from "next/image"
import Link from "next/link"
import { Package } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { cn, formatRupiah } from "@/lib/utils"
import type { Product, StockStatus } from "@/lib/types"

const STOCK_LABEL: Record<StockStatus, string> = {
  available: "Available",
  sold_out: "Sold out",
  preorder: "Pre-order",
}

export function ProductCard({ product }: { product: Product }) {
  const cover = product.images[0]
  const hasDiscount =
    product.compare_at_price != null &&
    product.compare_at_price > product.price

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className="overflow-hidden p-0 transition-shadow group-hover:shadow-md">
        <div className="bg-muted relative aspect-square w-full">
          {cover ? (
            <Image
              src={cover}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              <Package className="size-10" aria-hidden />
            </div>
          )}
          {product.stock_status !== "available" && (
            <Badge
              variant="secondary"
              className="absolute left-2 top-2 capitalize"
            >
              {STOCK_LABEL[product.stock_status]}
            </Badge>
          )}
        </div>
        <CardContent className="space-y-1 p-3">
          <h3 className="line-clamp-1 text-sm font-medium">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">
              {formatRupiah(product.price)}
            </span>
            {hasDiscount && (
              <span
                className={cn(
                  "text-muted-foreground text-xs line-through"
                )}
              >
                {formatRupiah(product.compare_at_price!)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
