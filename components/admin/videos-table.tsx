"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FilterSidebar, FilterSection, FilterField } from "./filter-sidebar"
import { SortableHeader, SortDirection } from "./sortable-header"
import { Loader2, Search, ChevronLeft, ChevronRight, Play, Trash2, Filter } from "lucide-react"
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
  const [deletingVideoId, setDeletingVideoId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [videoToDelete, setVideoToDelete] = useState<any>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const { toast } = useToast()
  const limit = 20

  // Filter state
  const [filters, setFilters] = useState({
    video_id: "",
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
      if (filters.video_id) params.video_id = filters.video_id
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

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : null)
    setSortDirection(direction)
    setPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setFilters({
      video_id: "",
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
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "")
  const totalPages = Math.ceil(total / limit)

  const handleDeleteClick = (video: any) => {
    setVideoToDelete(video)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
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
      
      // Refresh the list
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
          <FilterField label="Video ID" htmlFor="video_id">
            <Input
              id="video_id"
              placeholder="Filter by video ID..."
              value={filters.video_id}
              onChange={(e) => handleFilterChange("video_id", e.target.value)}
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
              placeholder="Min views..."
              value={filters.video_views_min}
              onChange={(e) => handleFilterChange("video_views_min", e.target.value)}
            />
          </FilterField>
          <FilterField label="Max Views" htmlFor="video_views_max">
            <Input
              id="video_views_max"
              type="number"
              placeholder="Max views..."
              value={filters.video_views_max}
              onChange={(e) => handleFilterChange("video_views_max", e.target.value)}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Engagement">
          <FilterField label="Min Upvotes" htmlFor="video_upvotes_min">
            <Input
              id="video_upvotes_min"
              type="number"
              placeholder="Min upvotes..."
              value={filters.video_upvotes_min}
              onChange={(e) => handleFilterChange("video_upvotes_min", e.target.value)}
            />
          </FilterField>
          <FilterField label="Max Upvotes" htmlFor="video_upvotes_max">
            <Input
              id="video_upvotes_max"
              type="number"
              placeholder="Max upvotes..."
              value={filters.video_upvotes_max}
              onChange={(e) => handleFilterChange("video_upvotes_max", e.target.value)}
            />
          </FilterField>
          <FilterField label="Min Downvotes" htmlFor="video_downvotes_min">
            <Input
              id="video_downvotes_min"
              type="number"
              placeholder="Min downvotes..."
              value={filters.video_downvotes_min}
              onChange={(e) => handleFilterChange("video_downvotes_min", e.target.value)}
            />
          </FilterField>
          <FilterField label="Max Downvotes" htmlFor="video_downvotes_max">
            <Input
              id="video_downvotes_max"
              type="number"
              placeholder="Max downvotes..."
              value={filters.video_downvotes_max}
              onChange={(e) => handleFilterChange("video_downvotes_max", e.target.value)}
            />
          </FilterField>
          <FilterField label="Min Comments" htmlFor="video_comments_min">
            <Input
              id="video_comments_min"
              type="number"
              placeholder="Min comments..."
              value={filters.video_comments_min}
              onChange={(e) => handleFilterChange("video_comments_min", e.target.value)}
            />
          </FilterField>
          <FilterField label="Max Comments" htmlFor="video_comments_max">
            <Input
              id="video_comments_max"
              type="number"
              placeholder="Max comments..."
              value={filters.video_comments_max}
              onChange={(e) => handleFilterChange("video_comments_max", e.target.value)}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Date Created">
          <FilterField label="Created After" htmlFor="created_after">
            <Input
              id="created_after"
              type="datetime-local"
              value={filters.created_after ? new Date(filters.created_after).toISOString().slice(0, 16) : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : ""
                handleFilterChange("created_after", date)
              }}
            />
          </FilterField>
          <FilterField label="Created Before" htmlFor="created_before">
            <Input
              id="created_before"
              type="datetime-local"
              value={filters.created_before ? new Date(filters.created_before).toISOString().slice(0, 16) : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : ""
                handleFilterChange("created_before", date)
              }}
            />
          </FilterField>
        </FilterSection>
      </FilterSidebar>

      {/* Main Content */}
      <div className="flex-1 space-y-4 min-w-0 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Quick search by video title..."
              value={filters.video_title}
              onChange={(e) => handleFilterChange("video_title", e.target.value)}
              className="pl-9"
            />
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
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">Thumbnail</th>
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
                </tr>
              </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-muted-foreground">
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

                  return (
                    <tr 
                      key={videoId} 
                      className="border-b hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
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
            <DialogTitle>Delete Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the video <strong>"{videoToDelete?.video_title || videoToDelete?.videoTitle || "Untitled"}"</strong>? This action cannot be undone and will delete all associated data including comments, replies, and views.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingVideoId !== null}
            >
              {deletingVideoId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

