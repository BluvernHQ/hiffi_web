import { Check } from "lucide-react"
import { CLAIM_STEPS, type ClaimStepId } from "@/lib/artist-index/claim-draft"
import { cn } from "@/lib/utils"

export function ClaimStepper({ current }: { current: ClaimStepId }) {
  const currentIndex = CLAIM_STEPS.findIndex((step) => step.id === current)

  return (
    <ol className="grid grid-cols-3 gap-3" aria-label="Claim progress">
      {CLAIM_STEPS.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        return (
          <li key={step.id} aria-current={active ? "step" : undefined} className="space-y-3">
            <span className="block h-[3px] overflow-hidden rounded-full bg-[#0B0B0C]/10">
              <span
                className={cn(
                  "block h-full origin-left rounded-full bg-[#E8192C] transition-transform duration-500 ease-out",
                  done || active ? "scale-x-100" : "scale-x-0",
                )}
              />
            </span>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "font-mono text-[10px] tracking-[0.2em]",
                  done || active ? "text-[#E8192C]" : "text-[#0B0B0C]/35",
                )}
                aria-hidden
              >
                {done ? <Check className="h-3 w-3" strokeWidth={3} /> : `0${index + 1}`}
              </span>
              <span className="sr-only">
                Step {index + 1} of {CLAIM_STEPS.length}:{" "}
              </span>
              <span
                className={cn(
                  "text-[13px] font-semibold",
                  active ? "text-[#0B0B0C]" : done ? "text-[#0B0B0C]/70" : "text-[#0B0B0C]/40",
                )}
              >
                {step.label}
              </span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
