"use client"

import { useState } from "react"
import * as Popover from "@radix-ui/react-popover"
import { Command } from "cmdk"
import { Check, ChevronDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import type { ChartCity } from "@/components/top-artists/premium/TopChartBoard"

/** Searchable list of every city chart; the chip row only fits the biggest few. */
export function TopChartCityPicker({
  cities,
  selected,
  highlight,
  onSelect,
}: {
  cities: ChartCity[]
  selected: ChartCity | null
  /** Show the trigger as active (the selected city isn't one of the visible chips). */
  highlight: boolean
  onSelect: (city: ChartCity) => void
}) {
  const [open, setOpen] = useState(false)
  const itemValue = (city: ChartCity) => `${city.label} ${city.key}`

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={cn(
          "inline-flex shrink-0 items-center gap-1 rounded-full py-1.5 pl-3 pr-2.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/40",
          highlight ? "bg-[#F4F1EA] text-[#0B0B0C]" : "text-white/55 hover:bg-white/[0.06] hover:text-white",
          open && !highlight && "bg-white/[0.08] text-white",
        )}
      >
        {highlight && selected ? selected.label : "More cities"}
        <ChevronDown className={cn("h-3.5 w-3.5 opacity-70 transition-transform", open && "rotate-180")} aria-hidden />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={8}
          collisionPadding={12}
          className="z-50 w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-white/10 bg-[#141416] text-[#F4F1EA] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.8)] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          <Command loop label="City charts" defaultValue={selected ? itemValue(selected) : undefined} className="flex flex-col">
            <div className="flex items-center gap-2.5 border-b border-white/10 px-4">
              <Search className="h-4 w-4 shrink-0 text-white/40" aria-hidden />
              <Command.Input
                autoFocus
                placeholder="Search cities"
                className="h-12 w-full bg-transparent text-sm text-[#F4F1EA] outline-none placeholder:text-white/40"
              />
            </div>
            <Command.List
              ref={(list) => {
                if (list) requestAnimationFrame(() => list.querySelector('[data-selected="true"]')?.scrollIntoView({ block: "center" }))
              }}
              className="scrollbar-none max-h-[min(22rem,55vh)] overflow-y-auto overscroll-contain p-1.5">
              <Command.Empty className="px-3 py-8 text-center text-sm text-white/45">No city chart by that name.</Command.Empty>
              {cities.map((city) => {
                const active = selected?.key === city.key
                return (
                  <Command.Item
                    key={city.key}
                    value={itemValue(city)}
                    onSelect={() => {
                      setOpen(false)
                      if (!active) onSelect(city)
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 outline-none transition-colors data-[selected=true]:bg-white/[0.07] data-[selected=true]:text-white"
                  >
                    <span className={cn("min-w-0 flex-1 truncate", active && "font-semibold text-white")}>{city.label}</span>
                    <span className="shrink-0 font-mono text-[10px] tabular-nums tracking-[0.12em] text-white/35">
                      {city.rankedCount.toLocaleString()}
                    </span>
                    <Check className={cn("h-4 w-4 shrink-0 text-[#E8192C]", active ? "opacity-100" : "opacity-0")} aria-hidden />
                  </Command.Item>
                )
              })}
            </Command.List>
            <p className="flex justify-between border-t border-white/10 px-4 py-2.5 font-mono text-[10px] uppercase tracking-[0.2em] text-white/35">
              <span>{cities.length} city charts</span>
              <span>Artists ranked</span>
            </p>
          </Command>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
