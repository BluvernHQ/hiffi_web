"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ChevronDown, ChevronUp, Filter, RotateCcw, X } from "lucide-react"

interface HorizontalFiltersProps {
  filters: {
    username: string
    name: string
    role: string
    followers_min: string
    followers_max: string
    following_min: string
    following_max: string
    total_videos_min: string
    total_videos_max: string
    created_after: string
    created_before: string
    updated_after: string
    updated_before: string
  }
  onFilterChange: (key: string, value: string) => void
  onClear: () => void
  isExpanded: boolean
  onToggleExpand: () => void
}

export function HorizontalFilters({
  filters,
  onFilterChange,
  onClear,
  isExpanded,
  onToggleExpand,
}: HorizontalFiltersProps) {
  const activeFilterCount = Object.values(filters).filter((v) => v !== "").length
  const hasActiveFilters = activeFilterCount > 0

  // Helper function to convert ISO string to datetime-local format (local time)
  const isoToLocalDateTime = (isoString: string): string => {
    if (!isoString) return ""
    const date = new Date(isoString)
    // Get local date/time components
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Get active filter labels for display
  const getActiveFilterLabels = () => {
    const labels: Array<{ key: string; label: string; value: string }> = []
    if (filters.username) labels.push({ key: "username", label: "Username", value: filters.username })
    if (filters.name) labels.push({ key: "name", label: "Name", value: filters.name })
    if (filters.role) labels.push({ key: "role", label: "Role", value: filters.role })
    if (filters.followers_min || filters.followers_max) {
      const range = [filters.followers_min, filters.followers_max].filter(Boolean).join("-")
      labels.push({ key: "followers", label: "Followers", value: range })
    }
    if (filters.following_min || filters.following_max) {
      const range = [filters.following_min, filters.following_max].filter(Boolean).join("-")
      labels.push({ key: "following", label: "Following", value: range })
    }
    if (filters.total_videos_min || filters.total_videos_max) {
      const range = [filters.total_videos_min, filters.total_videos_max].filter(Boolean).join("-")
      labels.push({ key: "videos", label: "Videos", value: range })
    }
    if (filters.created_after) labels.push({ key: "created_after", label: "Created After", value: new Date(filters.created_after).toLocaleDateString() })
    if (filters.created_before) labels.push({ key: "created_before", label: "Created Before", value: new Date(filters.created_before).toLocaleDateString() })
    return labels
  }

  const activeFilterLabels = getActiveFilterLabels()

  const removeFilter = (key: string) => {
    if (key === "followers") {
      onFilterChange("followers_min", "")
      onFilterChange("followers_max", "")
    } else if (key === "following") {
      onFilterChange("following_min", "")
      onFilterChange("following_max", "")
    } else if (key === "videos") {
      onFilterChange("total_videos_min", "")
      onFilterChange("total_videos_max", "")
    } else {
      onFilterChange(key, "")
    }
  }

  return (
    <div className="border rounded-lg bg-background shadow-sm">
      {/* Filter Header - Always Visible, More Compact */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Filter className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold flex-shrink-0">Filters</span>
          {hasActiveFilters && (
            <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-xs font-medium text-primary flex-shrink-0">
              {activeFilterCount}
            </span>
          )}
          {/* Active Filter Chips - Show when collapsed */}
          {!isExpanded && hasActiveFilters && (
            <div className="flex items-center gap-1.5 flex-wrap ml-2 min-w-0">
              {activeFilterLabels.slice(0, 4).map((filter) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs font-medium border"
                >
                  <span className="truncate max-w-[120px]">{filter.label}: {filter.value}</span>
                  <button
                    onClick={() => removeFilter(filter.key)}
                    className="hover:bg-muted-foreground/20 rounded p-0.5 -mr-1"
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {activeFilterLabels.length > 4 && (
                <span className="text-xs text-muted-foreground">+{activeFilterLabels.length - 4} more</span>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClear}
              className="h-7 gap-1 text-xs px-2"
            >
              <RotateCcw className="h-3 w-3" />
              Clear
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpand}
            className="h-7 gap-1 text-xs px-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-3 w-3" />
                <span className="hidden sm:inline">Collapse</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-3 w-3" />
                <span className="hidden sm:inline">Expand</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Filter Content - Collapsible */}
      {isExpanded && (
        <div className="p-2.5 space-y-2.5">
          {/* Row 1: Search Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="h-username" className="text-xs font-medium">
                Username
              </Label>
              <Input
                id="h-username"
                placeholder="Filter by username..."
                value={filters.username}
                onChange={(e) => onFilterChange("username", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-name" className="text-xs font-medium">
                Name
              </Label>
              <Input
                id="h-name"
                placeholder="Filter by name..."
                value={filters.name}
                onChange={(e) => onFilterChange("name", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-role" className="text-xs font-medium">
                Role
              </Label>
              <select
                id="h-role"
                value={filters.role}
                onChange={(e) => onFilterChange("role", e.target.value)}
                className="flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">All roles</option>
                <option value="user">User</option>
                <option value="creator">Creator</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Row 2: Followers & Following */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="h-followers-min" className="text-xs font-medium">
                Min Followers
              </Label>
              <Input
                id="h-followers-min"
                type="number"
                placeholder="Min..."
                value={filters.followers_min}
                onChange={(e) => onFilterChange("followers_min", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-followers-max" className="text-xs font-medium">
                Max Followers
              </Label>
              <Input
                id="h-followers-max"
                type="number"
                placeholder="Max..."
                value={filters.followers_max}
                onChange={(e) => onFilterChange("followers_max", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-following-min" className="text-xs font-medium">
                Min Following
              </Label>
              <Input
                id="h-following-min"
                type="number"
                placeholder="Min..."
                value={filters.following_min}
                onChange={(e) => onFilterChange("following_min", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-following-max" className="text-xs font-medium">
                Max Following
              </Label>
              <Input
                id="h-following-max"
                type="number"
                placeholder="Max..."
                value={filters.following_max}
                onChange={(e) => onFilterChange("following_max", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
          </div>

          {/* Row 3: Videos & Dates */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5">
            <div className="space-y-1.5">
              <Label htmlFor="h-videos-min" className="text-xs font-medium">
                Min Videos
              </Label>
              <Input
                id="h-videos-min"
                type="number"
                placeholder="Min..."
                value={filters.total_videos_min}
                onChange={(e) => onFilterChange("total_videos_min", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-videos-max" className="text-xs font-medium">
                Max Videos
              </Label>
              <Input
                id="h-videos-max"
                type="number"
                placeholder="Max..."
                value={filters.total_videos_max}
                onChange={(e) => onFilterChange("total_videos_max", e.target.value)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-created-after" className="text-xs font-medium">
                Created After
              </Label>
              <Input
                id="h-created-after"
                type="datetime-local"
                value={isoToLocalDateTime(filters.created_after)}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value).toISOString() : ""
                  onFilterChange("created_after", date)
                }}
                className={`
                  h-8 text-sm
                  ${filters.created_after && filters.created_before && 
                    new Date(filters.created_after) > new Date(filters.created_before)
                      ? "border-destructive"
                      : ""}
                `}
              />
              {filters.created_after && filters.created_before && 
               new Date(filters.created_after) > new Date(filters.created_before) && (
                <p className="text-xs text-destructive mt-1">
                  Created After must be before or equal to Created Before
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="h-created-before" className="text-xs font-medium">
                Created Before
              </Label>
              <Input
                id="h-created-before"
                type="datetime-local"
                value={isoToLocalDateTime(filters.created_before)}
                onChange={(e) => {
                  const date = e.target.value ? new Date(e.target.value).toISOString() : ""
                  onFilterChange("created_before", date)
                }}
                className={`
                  h-8 text-sm
                  ${filters.created_after && filters.created_before && 
                    new Date(filters.created_after) > new Date(filters.created_before)
                      ? "border-destructive"
                      : ""}
                `}
              />
              {filters.created_after && filters.created_before && 
               new Date(filters.created_after) > new Date(filters.created_before) && (
                <p className="text-xs text-destructive mt-1">
                  Created Before must be after or equal to Created After
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
