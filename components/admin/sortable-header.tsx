"use client"

import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type SortDirection = "asc" | "desc" | null

interface SortableHeaderProps {
  label: string
  sortKey: string
  currentSort?: string | null
  currentDirection?: SortDirection
  onSort: (key: string, direction: SortDirection) => void
  className?: string
}

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  currentDirection,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSort === sortKey

  const handleClick = () => {
    if (isActive) {
      // Cycle: asc -> desc -> null
      if (currentDirection === "asc") {
        onSort(sortKey, "desc")
      } else if (currentDirection === "desc") {
        onSort(sortKey, null)
      } else {
        onSort(sortKey, "asc")
      }
    } else {
      onSort(sortKey, "asc")
    }
  }

  return (
    <th className={cn("h-12 px-3 text-left align-middle font-semibold text-sm whitespace-nowrap", className)}>
      <Button
        variant="ghost"
        onClick={handleClick}
        className={cn(
          "h-auto p-0 font-semibold hover:bg-transparent",
          "flex items-center gap-1.5",
          isActive && "text-primary"
        )}
      >
        {label}
        {isActive ? (
          currentDirection === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : currentDirection === "desc" ? (
            <ArrowDown className="h-4 w-4" />
          ) : null
        ) : (
          <ArrowUpDown className="h-4 w-4 text-muted-foreground opacity-50" />
        )}
      </Button>
    </th>
  )
}
