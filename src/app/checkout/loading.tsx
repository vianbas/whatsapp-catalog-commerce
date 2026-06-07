import { Skeleton } from "@/components/ui/skeleton"

export default function CheckoutLoading() {
  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-4 w-20" />
      </div>

      <div className="space-y-8">
        <div className="rounded-lg border">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
          <div className="flex items-center justify-between border-t px-4 py-3">
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-6 w-28" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-5 w-36" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full rounded-md" />
            </div>
          ))}
        </div>

        <Skeleton className="h-12 w-full rounded-md" />
      </div>
    </main>
  )
}
