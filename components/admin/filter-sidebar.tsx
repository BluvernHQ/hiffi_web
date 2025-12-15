"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Filter, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  onClear: () => void
  activeFilterCount: number
  children: React.ReactNode
  title?: string
}

export function FilterSidebar({
  isOpen,
  onClose,
  onClear,
  activeFilterCount,
  children,
  title = "Filters",
}: FilterSidebarProps) {
  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-16 left-0 z-50 h-[calc(100vh-4rem)] w-80 border-r bg-background shadow-lg transition-transform duration-300 ease-in-out",
          "flex flex-col shrink-0 overflow-hidden",
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b px-6 shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">{title}</h2>
            {activeFilterCount > 0 && (
              <span className="ml-2 rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClear}
                className="h-8 gap-1.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="lg:hidden h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Content - Scrollable */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-6 pb-8">{children}</div>
          </ScrollArea>
        </div>
      </aside>
    </>
  )
}

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function FilterSection({ title, children, className }: FilterSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
        <Separator />
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

interface FilterFieldProps {
  label: string
  htmlFor?: string
  children: React.ReactNode
  description?: string
}

export function FilterField({ label, htmlFor, children, description }: FilterFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
