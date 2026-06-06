import Image from "next/image"
import Link from "next/link"
import { Package, Star } from "lucide-react"

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
  const soldOut = product.stock_status === "sold_out"

  return (
    <Link href={`/products/${product.slug}`} className="group block">
      <Card className={cn("overflow-hidden p-0 transition-shadow group-hover:shadow-md", soldOut && "opacity-75")}>
        <div className="bg-muted relative aspect-square w-full">
          {cover ? (
            <Image
              src={cover}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={cn("object-cover", soldOut && "grayscale")}
            />
          ) : (
            <div className="text-muted-foreground flex h-full w-full items-center justify-center">
              <Package className="size-10" aria-hidden />
            </div>
          )}
          {soldOut && (
            <div className="absolute inset-0 bg-background/30" />
          )}
          {product.stock_status !== "available" && (
            <Badge
              variant="secondary"
              className="absolute left-2 top-2 capitalize"
            >
              {STOCK_LABEL[product.stock_status]}
            </Badge>
          )}
          {product.is_featured && (
            <Badge className="absolute right-2 top-2 gap-1">
              <Star className="size-3" aria-hidden />
              Featured
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
              <span className="text-muted-foreground text-xs line-through">
                {formatRupiah(product.compare_at_price!)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
