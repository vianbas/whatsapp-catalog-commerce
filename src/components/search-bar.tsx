"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

/**
 * Storefront product search. Navigates to /products with the query, preserving
 * the active category and resetting pagination. Stateless re: URL — the current
 * values are passed in as props so we don't need useSearchParams (and its
 * Suspense boundary).
 */
export function SearchBar({
  defaultQuery = "",
  category,
}: {
  defaultQuery?: string
  category?: string
}) {
  const router = useRouter()
  const [value, setValue] = React.useState(defaultQuery)

  function navigate(q: string) {
    const params = new URLSearchParams()
    if (category) params.set("category", category)
    if (q.trim()) params.set("q", q.trim())
    const qs = params.toString()
    router.push(`/products${qs ? `?${qs}` : ""}`)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    navigate(value)
  }

  function handleClear() {
    setValue("")
    navigate("")
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          type="search"
          placeholder="Search products…"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="pl-9"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className="text-muted-foreground hover:text-foreground absolute right-2 top-1/2 -translate-y-1/2"
          >
            <X className="size-4" />
          </button>
        )}
      </div>
      <Button type="submit" variant="outline">
        Search
      </Button>
    </form>
  )
}
