"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app-error-boundary]", error)
  }, [error])

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-lg space-y-4 rounded-xl border bg-card p-6 text-center shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight">Something went wrong</h2>
        <p className="text-sm text-muted-foreground">
          We hit a runtime error on this page. Try again, or return to a safe route.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button asChild variant="outline">
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
