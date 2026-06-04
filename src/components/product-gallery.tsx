"use client"

import * as React from "react"
import Image from "next/image"
import { Package } from "lucide-react"

import { cn } from "@/lib/utils"

export function ProductGallery({
  images,
  alt,
}: {
  images: string[]
  alt: string
}) {
  const [selected, setSelected] = React.useState(0)
  const active = images[selected] ?? images[0]

  return (
    <div className="space-y-3">
      <div className="bg-muted relative aspect-square overflow-hidden rounded-lg">
        {active ? (
          <Image
            src={active}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="text-muted-foreground flex h-full w-full items-center justify-center">
            <Package className="size-16" aria-hidden />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setSelected(i)}
              aria-label={`Show image ${i + 1}`}
              aria-current={i === selected}
              className={cn(
                "bg-muted relative aspect-square overflow-hidden rounded-md border-2 transition-colors",
                i === selected ? "border-primary" : "border-transparent"
              )}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                sizes="80px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
