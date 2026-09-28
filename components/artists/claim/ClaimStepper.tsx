import { Check } from "lucide-react"
import { CLAIM_STEPS, type ClaimStepId } from "@/lib/artist-index/claim-draft"
import { cn } from "@/lib/utils"

export function ClaimStepper({ current }: { current: ClaimStepId }) {
  const currentIndex = CLAIM_STEPS.findIndex((step) => step.id === current)

  return (
    <ol className="grid grid-cols-3 gap-2" aria-label="Claim progress">
      {CLAIM_STEPS.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        return (
          <li key={step.id} aria-current={active ? "step" : undefined} className="space-y-2">
            <span
              className={cn(
                "block h-1.5 rounded-full transition-colors",
                done || active ? "bg-[#E8192C]" : "bg-muted",
              )}
            />
            <span
              className={cn(
                "flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em]",
                active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {done ? <Check className="h-3.5 w-3.5 text-[#E8192C]" aria-hidden /> : null}
              <span className="sr-only">
                Step {index + 1} of {CLAIM_STEPS.length}:{" "}
              </span>
              {step.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
