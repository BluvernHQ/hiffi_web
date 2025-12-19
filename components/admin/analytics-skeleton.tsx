"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AnalyticsSkeleton() {
  return (
    <Card className="border-2 shadow-lg">
      <CardHeader className="pb-4">
        <div className="h-6 w-48 bg-muted rounded animate-shimmer" />
        <div className="h-4 w-64 bg-muted rounded animate-shimmer mt-2" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-shimmer" />
              <div className="h-8 w-32 bg-muted rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
