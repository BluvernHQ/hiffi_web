import { cn } from "@/lib/utils"

/** Popover / dialog panel */
export const atpPanelClass = cn(
  "flex flex-col overflow-hidden rounded-2xl",
  "border border-black/[0.06] bg-white text-foreground",
  "shadow-[0_20px_50px_-12px_rgba(0,0,0,0.18)] backdrop-blur-xl",
  "dark:border-white/[0.08] dark:bg-[#12161c]/96 dark:shadow-[0_24px_80px_-12px_rgba(0,0,0,0.75)]",
)

/** Mobile bottom sheet — high contrast, YouTube-like */
export const atpSheetClass = cn(
  "flex min-h-0 flex-1 flex-col bg-white text-foreground dark:bg-[#0f1115]",
)

export const atpSheetHeaderClass = "px-4 pt-1 text-xl font-bold tracking-tight text-foreground"

export const atpSearchInputClass = (sheet = false) =>
  cn(
    "w-full rounded-xl border-black/[0.08] bg-black/[0.04] pl-10 shadow-none",
    "text-foreground placeholder:text-muted-foreground/70",
    "transition-[box-shadow,border-color,background-color] duration-200",
    "focus-visible:border-primary/35 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-primary/25",
    "dark:border-white/[0.08] dark:bg-white/[0.05] dark:focus-visible:bg-white/[0.07]",
    sheet ? "h-12 text-base" : "h-11 pl-9 text-sm",
  )

export const atpRowClass = (selected: boolean, sheet = false) =>
  cn(
    "group flex w-full items-center gap-3.5 text-left",
    "transition-colors duration-150",
    "hover:bg-black/[0.04] active:bg-black/[0.06]",
    "dark:hover:bg-white/[0.06] dark:active:bg-white/[0.08]",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    sheet ? "min-h-[60px] rounded-xl px-3 py-3" : "rounded-xl px-2 py-2.5",
    selected &&
      (sheet
        ? "bg-primary/[0.08] dark:bg-primary/12"
        : "bg-primary/[0.06] ring-1 ring-primary/25 dark:bg-primary/10"),
  )

export const atpPrimaryButtonClass = (sheet = false) =>
  cn(
    "rounded-full font-semibold text-primary-foreground shadow-sm transition-colors duration-200",
    "bg-primary hover:bg-primary/90",
    "active:scale-[0.98]",
    "disabled:pointer-events-none disabled:opacity-40",
    sheet ? "h-12 min-h-12 text-base" : "h-11",
  )

export const atpOutlineFooterButtonClass = (sheet = false) =>
  cn(
    "gap-2 rounded-full border-black/[0.12] bg-transparent font-semibold text-foreground",
    "hover:bg-black/[0.04] dark:border-white/[0.12] dark:hover:bg-white/[0.06]",
    sheet ? "h-12 min-h-12 flex-1 text-base" : "h-11 flex-1",
  )

export const atpChipClass = cn(
  "rounded-full border border-black/[0.08] bg-black/[0.02] px-3 py-2 text-sm font-medium text-foreground",
  "transition-colors hover:border-primary/30 hover:bg-primary/[0.06]",
  "dark:border-white/[0.08] dark:bg-white/[0.03]",
)

export const atpSheetFooterClass = cn(
  "flex shrink-0 gap-3 border-t border-black/[0.08] bg-white px-4 py-3",
  "pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-white/[0.08] dark:bg-[#0f1115]",
)
