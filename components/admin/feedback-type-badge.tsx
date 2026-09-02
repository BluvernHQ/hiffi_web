import { Lightbulb, MessageCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ParsedFeedbackDescription } from "@/lib/feedback/parse-feature-request"

type FeedbackTypeBadgeProps = {
  parsed: ParsedFeedbackDescription
  className?: string
}

export function FeedbackTypeBadge({ parsed, className }: FeedbackTypeBadgeProps) {
  if (parsed.kind === "feature-request") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary",
          className,
        )}
      >
        <Lightbulb className="h-3 w-3" aria-hidden="true" />
        Feature request
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground",
        className,
      )}
    >
      <MessageCircle className="h-3 w-3" aria-hidden="true" />
      Feedback
    </span>
  )
}
