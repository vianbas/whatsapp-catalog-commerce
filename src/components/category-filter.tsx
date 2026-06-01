import Link from "next/link"

import { cn } from "@/lib/utils"
import type { Category } from "@/lib/types"

/**
 * Horizontal, link-based category filter for the storefront. Implemented with
 * plain links (no client hooks) so it renders as a Server Component and stays
 * shareable/bookmarkable via the `?category=` query param.
 */
export function CategoryFilter({
  categories,
  activeSlug,
}: {
  categories: Pick<Category, "id" | "name" | "slug">[]
  activeSlug?: string
}) {
  const items = [{ id: "all", name: "All", slug: "" }, ...categories]

  return (
    <nav className="flex flex-wrap gap-2" aria-label="Product categories">
      {items.map((item) => {
        const isActive = (activeSlug ?? "") === item.slug
        const href = item.slug ? `/products?category=${item.slug}` : "/products"
        return (
          <Link
            key={item.id}
            href={href}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted"
            )}
          >
            {item.name}
          </Link>
        )
      })}
    </nav>
  )
}
