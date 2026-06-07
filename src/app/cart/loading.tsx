import { Skeleton } from "@/components/ui/skeleton"

export default function CartLoading() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-36" />
      </div>

      {/* Cart items */}
      <div className="divide-y rounded-lg border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-start gap-3 p-3">
            <Skeleton className="size-16 shrink-0 rounded-md" />
            <div className="flex-1 space-y-2">
              <div className="flex items-start justify-between gap-1">
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="size-7 rounded-md" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-24 rounded-md" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo input */}
      <div className="mt-6 flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-20 rounded-md" />
      </div>

      {/* Total */}
      <div className="mt-6 space-y-1 border-t pt-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-6 w-28" />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-col gap-3">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </main>
  )
}
