"use client"

import * as React from "react"
import Image from "next/image"
import { Loader2, Upload, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const BUCKET = "product-images"

/**
 * Uploads images to the Supabase Storage `product-images` bucket and surfaces
 * the resulting public URLs through `onChange`. The browser (anon) client is
 * created lazily, only when a file is selected.
 */
export function ImageUploader({
  value,
  onChange,
  className,
}: {
  value: string[]
  onChange: (urls: string[]) => void
  className?: string
}) {
  const [uploading, setUploading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploading(true)
    setError(null)

    try {
      const supabase = createClient()
      const uploaded: string[] = []

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() ?? "bin"
        const path = `${crypto.randomUUID()}.${ext}`
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false })

        if (uploadError) throw uploadError

        const {
          data: { publicUrl },
        } = supabase.storage.from(BUCKET).getPublicUrl(path)
        uploaded.push(publicUrl)
      }

      onChange([...value, ...uploaded])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex flex-wrap gap-3">
        {value.map((url, index) => (
          <div
            key={url}
            className="bg-muted relative size-20 overflow-hidden rounded-md border"
          >
            <Image
              src={url}
              alt={`Image ${index + 1}`}
              fill
              sizes="80px"
              className="object-cover"
            />
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="bg-background/80 absolute right-0.5 top-0.5 rounded-full p-0.5 hover:bg-background"
              aria-label="Remove image"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Upload className="size-4" />
        )}
        {uploading ? "Uploading…" : "Upload images"}
      </Button>

      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  )
}
