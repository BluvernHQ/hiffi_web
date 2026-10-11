"use client"

import { useState } from "react"
import { Check } from "lucide-react"

export function LaunchChecklist({ items, labelledBy }: { items: string[]; labelledBy: string }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  return (
    <ul aria-labelledby={labelledBy} className="space-y-3">
      {items.map((item, index) => {
        const id = `launch-checklist-${index}`
        const isChecked = Boolean(checked[item])
        return (
          <li key={item}>
            <label htmlFor={id} className="group flex cursor-pointer items-start gap-2.5">
              <input
                id={id}
                type="checkbox"
                checked={isChecked}
                onChange={(event) => setChecked((prev) => ({ ...prev, [item]: event.target.checked }))}
                className="peer sr-only"
              />
              <span
                className="mt-px flex h-4 w-4 shrink-0 items-center justify-center rounded border border-black/20 bg-white transition-colors group-hover:border-primary peer-checked:border-primary peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2 dark:border-white/25 dark:bg-transparent"
                aria-hidden
              >
                {isChecked && <Check className="h-3 w-3 text-white" strokeWidth={3.5} />}
              </span>
              <span className="text-[13px] leading-snug text-muted-foreground transition-colors peer-checked:text-foreground">
                {item}
              </span>
            </label>
          </li>
        )
      })}
    </ul>
  )
}
