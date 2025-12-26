"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Filter, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface FilterSidebarProps {
  isOpen: boolean
  onClose: () => void
  onClear: () => void
  activeFilterCount: number
  children: React.ReactNode
  title?: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export function FilterSidebar({
  isOpen,
  onClose,
  onClear,
  activeFilterCount,
  children,
  title = "Filters",
  isCollapsed = false,
  onToggleCollapse,
}: FilterSidebarProps) {
  return (
    <>
      {/* Mobile Overlay - Only show on mobile (below md breakpoint) when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:pointer-events-none md:opacity-0"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          // Mobile: fixed positioning for overlay behavior
          "fixed md:relative left-0 z-50 border-r bg-background shadow-lg",
          // Ensure background is always visible and not transparent
          "bg-background",
          // Only transition width and transform, not height or position
          "transition-[width,transform] duration-300 ease-in-out",
          "flex flex-col shrink-0 overflow-hidden",
          // Width: collapsed vs expanded - fixed widths prevent layout shifts
          // These are explicit widths that never change based on content
          isCollapsed ? "w-12 md:w-12" : "w-64 md:w-64",
          // Mobile: show/hide based on isOpen, Tablet/Desktop: always visible
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Fixed top position on mobile to prevent shifts
          "top-16 md:top-0",
          // Fixed height to prevent position shifts when content changes
          // On desktop (md+), use full height of grid container
          "h-[calc(100vh-4rem)] md:h-full",
          // Prevent layout shifts - isolate positioning
          "isolate",
          // Grid item alignment - align to start of grid row
          "md:row-start-1 md:col-start-1"
        )}
      >
        {/* Header */}
        <div className={cn(
          "flex items-center border-b shrink-0",
          // Only transition padding, not height - height should be fixed
          "transition-[padding] duration-300",
          // Fixed heights to prevent layout shifts
          isCollapsed ? "justify-center h-12 px-0 !h-12" : "justify-between h-16 px-4 !h-16"
        )}>
          {!isCollapsed && (
            <>
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Filter icon with badge overlay */}
                <div className="relative shrink-0">
                  <Filter className="h-5 w-5 text-primary" />
                  {/* Badge positioned on top-right of icon */}
                  {activeFilterCount > 0 && (
                    <span className={cn(
                      "absolute -top-1.5 -right-1.5 rounded-full",
                      "min-w-[18px] h-[18px] flex items-center justify-center",
                      "px-1 text-[10px] font-bold leading-none",
                      // High contrast: solid primary background with white text
                      "bg-primary text-primary-foreground",
                      // Strong border and shadow for maximum visibility
                      "border-2 border-background shadow-md",
                      // Ensure it stands out
                      "z-10"
                    )}>
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold truncate">{title}</h2>
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
                {onToggleCollapse && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onToggleCollapse}
                    className="hidden md:flex h-8 w-8"
                    aria-label="Collapse filters"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="md:hidden h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
          {isCollapsed && onToggleCollapse && (
            <div className="flex flex-col items-center gap-2 w-full">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-10 w-10 relative"
                aria-label="Expand filters"
                title="Expand filters"
              >
                <Filter className="h-5 w-5 text-primary" />
                {/* Badge positioned on top-right of icon */}
                {activeFilterCount > 0 && (
                  <span className={cn(
                    "absolute top-0 right-0 rounded-full",
                    "min-w-[18px] h-[18px] flex items-center justify-center",
                    "px-1 text-[10px] font-bold leading-none",
                    // High contrast: solid primary background with white text
                    "bg-primary text-primary-foreground",
                    // Strong border and shadow for maximum visibility
                    "border-2 border-background shadow-md",
                    // Ensure it stands out
                    "z-10"
                  )}>
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Filter Content - Scrollable (hidden when collapsed) */}
        {!isCollapsed && (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-background" style={{ contain: 'layout style' }}>
            <ScrollArea className="h-full flex-1">
              <div className="p-4 space-y-5 pb-6 bg-background">{children}</div>
            </ScrollArea>
          </div>
        )}
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
    <div className={cn("space-y-3", className)}>
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-1">{title}</h3>
        <Separator />
      </div>
      <div className="space-y-2.5">{children}</div>
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
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-medium">
        {label}
      </Label>
      {children}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
