"use client"

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Search and filter bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="h-10 w-full sm:w-64 bg-muted rounded animate-shimmer" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-muted rounded animate-shimmer" />
          <div className="h-10 w-24 bg-muted rounded animate-shimmer" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="border rounded-lg overflow-hidden">
        {/* Table header */}
        <div className="bg-muted/50 border-b p-4">
          <div className="grid grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-4 bg-muted rounded animate-shimmer" />
            ))}
          </div>
        </div>

        {/* Table rows */}
        {Array.from({ length: 10 }).map((_, rowIndex) => (
          <div key={rowIndex} className="border-b p-4 last:border-b-0">
            <div className="grid grid-cols-6 gap-4 items-center">
              {Array.from({ length: 6 }).map((_, colIndex) => (
                <div
                  key={colIndex}
                  className={`h-4 bg-muted rounded animate-shimmer ${
                    colIndex === 0 ? "w-32" : colIndex === 1 ? "w-24" : "w-20"
                  }`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-4 w-32 bg-muted rounded animate-shimmer" />
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-muted rounded animate-shimmer" />
          <div className="h-10 w-24 bg-muted rounded animate-shimmer" />
        </div>
      </div>
    </div>
  )
}
