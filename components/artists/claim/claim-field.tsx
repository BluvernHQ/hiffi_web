import type { ReactNode } from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const claimControlBase =
  "rounded-xl border-[#0B0B0C]/12 bg-[#FAF8F3] px-4 text-[15px] shadow-none transition-[border-color,box-shadow,background-color] placeholder:text-[#0B0B0C]/35 hover:border-[#0B0B0C]/25 focus-visible:border-[#0B0B0C]/40 focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-[#E8192C]/12 aria-invalid:border-[#E8192C]/60 aria-invalid:ring-[#E8192C]/10 md:text-[15px]"

export const claimInputClass = cn("h-12", claimControlBase)

/** Select triggers size themselves via `data-size`, so the height override has to match that variant. */
export const claimSelectClass = cn(
  "w-full data-[size=default]:h-12 data-[placeholder]:text-[#0B0B0C]/35",
  claimControlBase,
)

export function ClaimField({
  id,
  label,
  optional,
  hint,
  error,
  children,
}: {
  id: string
  label: string
  optional?: boolean
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="flex items-center gap-2 text-[13px] font-semibold text-[#0B0B0C]">
        {label}
        {optional ? (
          <span className="font-mono text-[10px] font-normal uppercase tracking-[0.2em] text-[#77726A]">Optional</span>
        ) : (
          <span className="text-[#E8192C]/80" aria-hidden>
            *
          </span>
        )}
      </Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="text-sm text-[#D0142A]">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-[#77726A]">{hint}</p>
      ) : null}
    </div>
  )
}

export function ClaimSection({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] border border-[#0B0B0C]/10 bg-white p-6 shadow-[0_24px_60px_-40px_rgba(11,11,12,0.35)] sm:p-8",
        className,
      )}
    >
      <h2 className="font-signal text-[1.9rem] font-bold uppercase leading-[0.9] tracking-[-0.005em] text-[#0B0B0C] sm:text-[2.25rem]">
        {title}
      </h2>
      {description ? <p className="mt-3 max-w-xl text-sm leading-6 text-[#77726A]">{description}</p> : null}
      <div className="mt-7 grid gap-5">{children}</div>
    </section>
  )
}
