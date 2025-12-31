"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { FilterSidebar, FilterSection, FilterField } from "./filter-sidebar"
import { SortableHeader, SortDirection } from "./sortable-header"
import { Loader2, Search, ChevronLeft, ChevronRight, Play, Trash2, Filter, CheckCircle2, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { getThumbnailUrl } from "@/lib/storage"
import { AuthenticatedImage } from "@/components/video/authenticated-image"
import { format } from "date-fns"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function AdminVideosTable() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(true)
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true)
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<any>(null)
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [isBulkDelete, setIsBulkDelete] = useState(false)
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState({ current: 0, total: 0 })
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const { toast } = useToast()
  const limit = 20

  // Refs to maintain focus on search input
  const searchInputRef = useRef<HTMLInputElement>(null)
  const wasSearchFocusedRef = useRef(false)

  // Debounce timers for number inputs
  const numberInputTimersRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Load collapsed state from localStorage on mount (shared across all admin pages)
  useEffect(() => {
    const savedState = localStorage.getItem("admin-filter-collapsed")
    if (savedState !== null) {
      setIsFilterCollapsed(savedState === "true")
    }
  }, [])

  // Save collapsed state to localStorage (shared across all admin pages)
  const handleToggleCollapse = () => {
    const newState = !isFilterCollapsed
    setIsFilterCollapsed(newState)
    localStorage.setItem("admin-filter-collapsed", String(newState))
  }

  // Filter state
  const [filters, setFilters] = useState({
    video_title: "",
    video_description: "",
    user_username: "",
    user_uid: "",
    video_tag: "",
    video_views_min: "",
    video_views_max: "",
    video_upvotes_min: "",
    video_upvotes_max: "",
    video_downvotes_min: "",
    video_downvotes_max: "",
    video_comments_min: "",
    video_comments_max: "",
    created_after: "",
    created_before: "",
    updated_after: "",
    updated_before: "",
  })

  const fetchVideos = async () => {
    try {
      setLoading(true)
      // Calculate offset: page 1 = offset 0, page 2 = offset 20, etc.
      const offset = Math.max(0, (page - 1) * limit)
      
      // Build filter params
      const params: any = { limit, offset }
      
      console.log("[admin] Fetching videos:", { page, limit, offset })
      if (filters.video_title) params.video_title = filters.video_title
      if (filters.video_description) params.video_description = filters.video_description
      if (filters.user_username) params.user_username = filters.user_username
      if (filters.user_uid) params.user_uid = filters.user_uid
      if (filters.video_tag) params.video_tag = filters.video_tag
      if (filters.video_views_min) params.video_views_min = parseInt(filters.video_views_min)
      if (filters.video_views_max) params.video_views_max = parseInt(filters.video_views_max)
      if (filters.video_upvotes_min) params.video_upvotes_min = parseInt(filters.video_upvotes_min)
      if (filters.video_upvotes_max) params.video_upvotes_max = parseInt(filters.video_upvotes_max)
      if (filters.video_downvotes_min) params.video_downvotes_min = parseInt(filters.video_downvotes_min)
      if (filters.video_downvotes_max) params.video_downvotes_max = parseInt(filters.video_downvotes_max)
      if (filters.video_comments_min) params.video_comments_min = parseInt(filters.video_comments_min)
      if (filters.video_comments_max) params.video_comments_max = parseInt(filters.video_comments_max)
      if (filters.created_after) params.created_after = filters.created_after
      if (filters.created_before) params.created_before = filters.created_before
      if (filters.updated_after) params.updated_after = filters.updated_after
      if (filters.updated_before) params.updated_before = filters.updated_before

      const response = await apiClient.adminListVideos(params)
      let videosData = response.videos || []
      
      // Client-side sorting
      if (sortKey && sortDirection) {
        videosData = [...videosData].sort((a, b) => {
          let aValue: any = a[sortKey]
          let bValue: any = b[sortKey]
          
          // Handle nested properties
          if (sortKey === "video_title") aValue = (a.video_title || a.videoTitle || "").toLowerCase()
          if (sortKey === "user_username") aValue = (a.user_username || a.userUsername || "").toLowerCase()
          if (sortKey === "video_views") aValue = a.video_views || a.videoViews || 0
          if (sortKey === "created_at") aValue = (a.created_at || a.createdAt) ? new Date(a.created_at || a.createdAt).getTime() : 0
          
          if (sortKey === "video_title") bValue = (b.video_title || b.videoTitle || "").toLowerCase()
          if (sortKey === "user_username") bValue = (b.user_username || b.userUsername || "").toLowerCase()
          if (sortKey === "video_views") bValue = b.video_views || b.videoViews || 0
          if (sortKey === "created_at") bValue = (b.created_at || b.createdAt) ? new Date(b.created_at || b.createdAt).getTime() : 0
          
          // Handle string comparison
          if (typeof aValue === "string" && typeof bValue === "string") {
            const comparison = aValue.localeCompare(bValue)
            return sortDirection === "asc" ? comparison : -comparison
          }
          
          // Handle number comparison
          const comparison = (aValue || 0) - (bValue || 0)
          return sortDirection === "asc" ? comparison : -comparison
        })
      }
      
      setVideos(videosData)
      
      // Handle total count - API might return count as page size, not total
      let totalCount = response.count || 0
      
      // Smart total count detection:
      // 1. If we got a full page (limit items), there might be more pages
      // 2. If we got fewer than limit, this is the last page
      // 3. If API count is much larger than current page, trust it
      if (videosData.length === limit) {
        // Full page - check if API count is reliable
        if (totalCount === limit || totalCount === 0 || totalCount === videosData.length) {
          // API likely returned page count, not total - estimate at least one more page exists
          totalCount = (page * limit) + 1
        } else if (totalCount > (page * limit)) {
          // API returned a total larger than current page - trust it
          // totalCount stays as-is
        }
      } else if (videosData.length < limit) {
        // Partial page - this is definitely the last page
        totalCount = (page - 1) * limit + videosData.length
      }
      
      setTotal(totalCount)
      console.log("[admin] Videos fetched:", {
        count: videosData.length,
        total: totalCount,
        page,
        limit,
        offset,
        totalPages: Math.ceil(totalCount / limit),
        responseCount: response.count,
        response: response
      })
    } catch (error) {
      console.error("[admin] Failed to fetch videos:", error)
      toast({
        title: "Error",
        description: "Failed to fetch videos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [page, filters, sortKey, sortDirection])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(numberInputTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [])

  // Maintain focus on search input after re-renders
  // This runs whenever videos, loading, or filters change to ensure focus is maintained during search
  useEffect(() => {
    if (wasSearchFocusedRef.current && searchInputRef.current) {
      // Use double requestAnimationFrame to ensure DOM is fully updated after state changes
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (searchInputRef.current) {
            // Always restore focus if it was previously focused, even if currently focused
            // This ensures focus is maintained through all re-renders
            if (document.activeElement !== searchInputRef.current) {
              searchInputRef.current.focus()
            }
            // Restore cursor position at the end
            const cursorPosition = filters.video_title.length
            searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition)
          }
        })
      })
    }
  }, [videos, loading, filters.video_title])

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : null)
    setSortDirection(direction)
    setPage(1)
    setSelectedVideoIds([]) // Clear selection when sorting
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filters change
    setSelectedVideoIds([]) // Clear selection when filtering
  }

  // Handle number input changes with debouncing to prevent page refresh on arrow clicks
  const handleNumberFilterChange = (key: string, value: string) => {
    // Prevent negative values - if value is negative or would become negative, set to empty or 0
    let sanitizedValue = value
    if (value !== "" && value !== "-") {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue < 0) {
        sanitizedValue = "0"
      }
    }
    
    // Update the filter value immediately for UI responsiveness
    setFilters((prev) => ({ ...prev, [key]: sanitizedValue }))
    
    // Clear existing timer for this field
    if (numberInputTimersRef.current[key]) {
      clearTimeout(numberInputTimersRef.current[key])
    }
    
    // Debounce the page reset - wait 500ms after user stops clicking arrows
    numberInputTimersRef.current[key] = setTimeout(() => {
      setPage(1)
      setSelectedVideoIds([]) // Clear selection when filtering
      delete numberInputTimersRef.current[key]
    }, 500)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = videos.map(v => v.video_id || v.videoId).filter(Boolean)
      setSelectedVideoIds(allIds)
    } else {
      setSelectedVideoIds([])
    }
  }

  const handleSelectVideo = (videoId: string, checked: boolean) => {
    if (checked) {
      setSelectedVideoIds(prev => [...prev, videoId])
    } else {
      setSelectedVideoIds(prev => prev.filter(id => id !== videoId))
    }
  }

  const handleDeleteClick = (video: any) => {
    setVideoToDelete(video)
    setIsBulkDelete(false)
    setDeleteDialogOpen(true)
  }

  const handleBulkDeleteClick = () => {
    setIsBulkDelete(true)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (isBulkDelete) {
      if (selectedVideoIds.length === 0) return

      try {
        setLoading(true)
        setBulkDeleteProgress({ current: 0, total: selectedVideoIds.length })
        
        let successCount = 0
        let errorCount = 0

        for (const videoId of selectedVideoIds) {
          try {
            await apiClient.deleteVideoByVideoId(videoId)
            successCount++
          } catch (error) {
            console.error(`[admin] Failed to delete video ${videoId}:`, error)
            errorCount++
          }
          setBulkDeleteProgress(prev => ({ ...prev, current: prev.current + 1 }))
        }

        toast({
          title: "Bulk Delete Complete",
          description: `Successfully deleted ${successCount} videos.${errorCount > 0 ? ` Failed to delete ${errorCount} videos.` : ""}`,
          variant: errorCount > 0 ? "destructive" : "default",
        })

        setSelectedVideoIds([])
        await fetchVideos()
      } catch (error: any) {
        console.error("[admin] Bulk delete error:", error)
        toast({
          title: "Error",
          description: "An error occurred during bulk deletion",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
        setDeleteDialogOpen(false)
        setIsBulkDelete(false)
        setBulkDeleteProgress({ current: 0, total: 0 })
      }
    } else {
      if (!videoToDelete) return
      const videoId = videoToDelete.video_id || videoToDelete.videoId
      if (!videoId) return

      try {
        setDeletingVideoId(videoId)
        await apiClient.deleteVideoByVideoId(videoId)
        
        toast({
          title: "Success",
          description: "Video deleted successfully",
        })
        
        setSelectedVideoIds(prev => prev.filter(id => id !== videoId))
        await fetchVideos()
      } catch (error: any) {
        console.error("[admin] Failed to delete video:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to delete video",
          variant: "destructive",
        })
      } finally {
        setDeletingVideoId(null)
        setDeleteDialogOpen(false)
        setVideoToDelete(null)
      }
    }
  }

  const clearFilters = () => {
    setFilters({
      video_title: "",
      video_description: "",
      user_username: "",
      user_uid: "",
      video_tag: "",
      video_views_min: "",
      video_views_max: "",
      video_upvotes_min: "",
      video_upvotes_max: "",
      video_downvotes_min: "",
      video_downvotes_max: "",
      video_comments_min: "",
      video_comments_max: "",
      created_after: "",
      created_before: "",
      updated_after: "",
      updated_before: "",
    })
    setPage(1)
    setSelectedVideoIds([])
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "")
  const totalPages = Math.ceil(total / limit)

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

  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex gap-6 min-h-0 overflow-hidden">
      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onClear={clearFilters}
        activeFilterCount={Object.values(filters).filter((v) => v !== "").length}
        isCollapsed={isFilterCollapsed}
        onToggleCollapse={handleToggleCollapse}
      >
        <FilterSection title="Search">
          <FilterField label="Video Title" htmlFor="video_title">
            <Input
              id="video_title"
              placeholder="Filter by title..."
              value={filters.video_title}
              onChange={(e) => handleFilterChange("video_title", e.target.value)}
            />
          </FilterField>
          <FilterField label="Description" htmlFor="video_description">
            <Input
              id="video_description"
              placeholder="Filter by description..."
              value={filters.video_description}
              onChange={(e) => handleFilterChange("video_description", e.target.value)}
            />
          </FilterField>
          <FilterField label="Video Tag" htmlFor="video_tag">
            <Input
              id="video_tag"
              placeholder="Filter by tag..."
              value={filters.video_tag}
              onChange={(e) => handleFilterChange("video_tag", e.target.value)}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Creator">
          <FilterField label="Creator Username" htmlFor="user_username">
            <Input
              id="user_username"
              placeholder="Filter by creator..."
              value={filters.user_username}
              onChange={(e) => handleFilterChange("user_username", e.target.value)}
            />
          </FilterField>
          <FilterField label="Creator UID" htmlFor="user_uid">
            <Input
              id="user_uid"
              placeholder="Filter by creator UID..."
              value={filters.user_uid}
              onChange={(e) => handleFilterChange("user_uid", e.target.value)}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Views">
          <FilterField label="Min Views" htmlFor="video_views_min">
            <Input
              id="video_views_min"
              type="number"
              min="0"
              placeholder="Min views..."
              value={filters.video_views_min}
              onChange={(e) => handleNumberFilterChange("video_views_min", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
          <FilterField label="Max Views" htmlFor="video_views_max">
            <Input
              id="video_views_max"
              type="number"
              min="0"
              placeholder="Max views..."
              value={filters.video_views_max}
              onChange={(e) => handleNumberFilterChange("video_views_max", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Engagement">
          <FilterField label="Min Upvotes" htmlFor="video_upvotes_min">
            <Input
              id="video_upvotes_min"
              type="number"
              min="0"
              placeholder="Min upvotes..."
              value={filters.video_upvotes_min}
              onChange={(e) => handleNumberFilterChange("video_upvotes_min", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
          <FilterField label="Max Upvotes" htmlFor="video_upvotes_max">
            <Input
              id="video_upvotes_max"
              type="number"
              min="0"
              placeholder="Max upvotes..."
              value={filters.video_upvotes_max}
              onChange={(e) => handleNumberFilterChange("video_upvotes_max", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
          <FilterField label="Min Downvotes" htmlFor="video_downvotes_min">
            <Input
              id="video_downvotes_min"
              type="number"
              min="0"
              placeholder="Min downvotes..."
              value={filters.video_downvotes_min}
              onChange={(e) => handleNumberFilterChange("video_downvotes_min", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
          <FilterField label="Max Downvotes" htmlFor="video_downvotes_max">
            <Input
              id="video_downvotes_max"
              type="number"
              min="0"
              placeholder="Max downvotes..."
              value={filters.video_downvotes_max}
              onChange={(e) => handleNumberFilterChange("video_downvotes_max", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
          <FilterField label="Min Comments" htmlFor="video_comments_min">
            <Input
              id="video_comments_min"
              type="number"
              min="0"
              placeholder="Min comments..."
              value={filters.video_comments_min}
              onChange={(e) => handleNumberFilterChange("video_comments_min", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
          <FilterField label="Max Comments" htmlFor="video_comments_max">
            <Input
              id="video_comments_max"
              type="number"
              min="0"
              placeholder="Max comments..."
              value={filters.video_comments_max}
              onChange={(e) => handleNumberFilterChange("video_comments_max", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Date Created">
          <FilterField label="Created After" htmlFor="created_after">
            <Input
              id="created_after"
              type="datetime-local"
              value={isoToLocalDateTime(filters.created_after)}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : ""
                handleFilterChange("created_after", date)
              }}
              className={
                filters.created_after && filters.created_before && 
                new Date(filters.created_after) > new Date(filters.created_before)
                  ? "border-destructive"
                  : ""
              }
            />
            {filters.created_after && filters.created_before && 
             new Date(filters.created_after) > new Date(filters.created_before) && (
              <p className="text-xs text-destructive mt-1">
                Created After must be before or equal to Created Before
              </p>
            )}
          </FilterField>
          <FilterField label="Created Before" htmlFor="created_before">
            <Input
              id="created_before"
              type="datetime-local"
              value={isoToLocalDateTime(filters.created_before)}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : ""
                handleFilterChange("created_before", date)
              }}
              className={
                filters.created_after && filters.created_before && 
                new Date(filters.created_after) > new Date(filters.created_before)
                  ? "border-destructive"
                  : ""
              }
            />
            {filters.created_after && filters.created_before && 
             new Date(filters.created_after) > new Date(filters.created_before) && (
              <p className="text-xs text-destructive mt-1">
                Created Before must be after or equal to Created After
              </p>
            )}
          </FilterField>
        </FilterSection>
      </FilterSidebar>

      {/* Main Content */}
      <div className="flex-1 space-y-4 min-w-0 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                placeholder="Quick search by video title..."
                value={filters.video_title}
                onChange={(e) => {
                  handleFilterChange("video_title", e.target.value)
                  wasSearchFocusedRef.current = true
                }}
                onFocus={() => {
                  wasSearchFocusedRef.current = true
                }}
                onBlur={() => {
                  // Only clear the flag if focus is moving to another element, not when component re-renders
                  setTimeout(() => {
                    if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
                      wasSearchFocusedRef.current = false
                    }
                  }, 0)
                }}
                className="pl-9"
              />
            </div>
            
            {selectedVideoIds.length > 0 && (
              <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                <span className="text-sm font-medium text-muted-foreground">
                  {selectedVideoIds.length} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDeleteClick}
                  className="gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
          
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                {Object.values(filters).filter((v) => v !== "").length}
              </span>
            )}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-background shadow-sm flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 bg-muted/50 z-10">
                <tr className="border-b">
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm sticky left-0 z-20 bg-muted/95 backdrop-blur-sm border-r">Thumbnail</th>
                  <SortableHeader
                    label="Title"
                    sortKey="video_title"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Creator"
                    sortKey="user_username"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Views"
                    sortKey="video_views"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Uploaded"
                    sortKey="created_at"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">Actions</th>
                  <th className="h-12 w-12 px-4 text-center align-middle font-semibold text-sm sticky right-0 z-30 bg-muted/95 backdrop-blur-sm border-l">
                    <Checkbox
                      checked={videos.length > 0 && selectedVideoIds.length === videos.length}
                      onCheckedChange={(checked) => handleSelectAll(!!checked)}
                      aria-label="Select all"
                    />
                  </th>
                </tr>
              </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-base font-medium">No videos found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {hasActiveFilters ? "Try adjusting your filters" : "No videos in the system"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                videos.map((video) => {
                  const videoId = video.video_id || video.videoId
                  const thumbnailPath = video.video_thumbnail || video.videoThumbnail || ""
                  const thumbnailUrl = getThumbnailUrl(thumbnailPath)
                  const title = video.video_title || video.videoTitle || "Untitled"
                  const username = video.user_username || video.userUsername
                  const views = video.video_views || video.videoViews || 0
                  const createdAt = video.created_at || video.createdAt
                  const isSelected = selectedVideoIds.includes(videoId)

                  return (
                    <tr 
                      key={videoId} 
                      className={`border-b hover:bg-muted/50 transition-colors ${isSelected ? "bg-primary/5" : ""}`}
                    >
                      <td className="px-4 py-3 sticky left-0 z-10 bg-inherit border-r">
                        {videoId ? (
                          <Link href={`/watch/${videoId}`} className="block group">
                            <div className="relative h-16 w-28 rounded overflow-hidden bg-muted group-hover:opacity-80 transition-opacity">
                              {thumbnailUrl ? (
                                <>
                                  <AuthenticatedImage
                                    src={thumbnailUrl}
                                    alt={title}
                                    fill
                                    className="object-cover"
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 pointer-events-none">
                                    <Play className="h-6 w-6 text-white" />
                                  </div>
                                </>
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Play className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </Link>
                        ) : (
                          <div className="relative h-16 w-28 rounded overflow-hidden bg-muted">
                            {thumbnailUrl ? (
                              <img
                                src={thumbnailUrl}
                                alt={title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Play className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <div className="font-medium line-clamp-2">{title}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {username ? (
                          <Link
                            href={`/profile/${username}`}
                            className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                          >
                            @{username}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="px-5 py-4 font-medium">{views.toLocaleString()}</td>
                      <td className="px-5 py-4 text-sm text-muted-foreground">
                        {createdAt
                          ? format(new Date(createdAt), "MMM d, yyyy")
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        {videoId && (
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10">
                              <Link href={`/watch/${videoId}`}>View</Link>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteClick(video)}
                              disabled={deletingVideoId === videoId}
                              className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                            >
                              {deletingVideoId === videoId ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 sticky right-0 z-10 bg-inherit border-l text-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleSelectVideo(videoId, !!checked)}
                          aria-label={`Select video ${title}`}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t shrink-0">
          <div className="text-sm text-muted-foreground">
            {total > 0 ? (
              <>
                Showing <span className="font-medium text-foreground">{((page - 1) * limit) + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span> videos
                {totalPages > 1 && (
                  <span className="ml-2">(Page {page} of {totalPages})</span>
                )}
              </>
            ) : (
              <span>No videos found</span>
            )}
          </div>
          {totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="gap-1"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const pages: (number | string)[] = []
                    const maxVisible = 7
                    
                    if (totalPages <= maxVisible) {
                      // Show all pages if 7 or fewer
                      for (let i = 1; i <= totalPages; i++) {
                        pages.push(i)
                      }
                    } else {
                      // Show first page
                      pages.push(1)
                      
                      if (page > 3) {
                        pages.push("...")
                      }
                      
                      // Show pages around current page
                      const start = Math.max(2, page - 1)
                      const end = Math.min(totalPages - 1, page + 1)
                      
                      for (let i = start; i <= end; i++) {
                        pages.push(i)
                      }
                      
                      if (page < totalPages - 2) {
                        pages.push("...")
                      }
                      
                      // Show last page
                      pages.push(totalPages)
                    }
                    
                    return pages.map((p, idx) => {
                      if (p === "...") {
                        return (
                          <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                            ...
                          </span>
                        )
                      }
                      
                      const pageNum = p as number
                      return (
                        <Button
                          key={pageNum}
                          variant={page === pageNum ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNum)}
                          className="min-w-[2.5rem]"
                        >
                          {pageNum}
                        </Button>
                      )
                    })
                  })()}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="gap-1"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="text-xs text-muted-foreground">
                {total > 0 && total <= limit ? "All videos displayed" : ""}
              </div>
            )}
          </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isBulkDelete ? "Delete Multiple Videos" : "Delete Video"}</DialogTitle>
            <DialogDescription asChild>
              <div>
                {isBulkDelete ? (
                  <>
                    Are you sure you want to delete <strong>{selectedVideoIds.length}</strong> selected videos? This action cannot be undone and will delete all associated data for each video.
                    {bulkDeleteProgress.total > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Deleting videos...</span>
                          <span>{bulkDeleteProgress.current} / {bulkDeleteProgress.total}</span>
                        </div>
                        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300" 
                            style={{ width: `${(bulkDeleteProgress.current / bulkDeleteProgress.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    Are you sure you want to delete the video <strong>"{videoToDelete?.video_title || videoToDelete?.videoTitle || "Untitled"}"</strong>? This action cannot be undone and will delete all associated data including comments, replies, and views.
                  </>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false)
              if (!isBulkDelete) setVideoToDelete(null)
            }} disabled={deletingVideoId !== null || bulkDeleteProgress.total > 0}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingVideoId !== null || bulkDeleteProgress.total > 0}
            >
              {deletingVideoId || bulkDeleteProgress.total > 0 ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

