"use client"

import { Card, CardContent } from "@/components/ui/card"

export function VideoCardSkeleton() {
  return (
    <div className="w-full">
      <Card className="overflow-hidden border-0 shadow-none bg-transparent h-full">
        <CardContent className="p-0 space-y-3">
          {/* Thumbnail skeleton */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted animate-shimmer" />
          
          {/* Content skeleton */}
          <div className="flex gap-2 sm:gap-3 px-1">
            {/* Avatar skeleton */}
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-muted flex-shrink-0 animate-shimmer" />
            
            {/* Text skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              {/* Title skeleton */}
              <div className="space-y-1.5">
                <div className="h-4 bg-muted rounded animate-shimmer" style={{ width: '90%' }} />
                <div className="h-4 bg-muted rounded animate-shimmer" style={{ width: '60%' }} />
              </div>
              {/* Metadata skeleton */}
              <div className="flex items-center gap-1.5">
                <div className="h-3 bg-muted rounded animate-shimmer" style={{ width: '80px' }} />
                <span className="text-muted-foreground">•</span>
                <div className="h-3 bg-muted rounded animate-shimmer" style={{ width: '60px' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

