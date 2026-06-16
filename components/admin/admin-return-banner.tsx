import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AdminReturnBanner({ returnTo }: { returnTo: string }) {
  if (!returnTo.startsWith("/admin/")) return null

  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2 flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">Opened from a content report</p>
      <Button variant="outline" size="sm" asChild className="gap-2 shrink-0">
        <Link href={returnTo}>
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to report
        </Link>
      </Button>
    </div>
  )
}
