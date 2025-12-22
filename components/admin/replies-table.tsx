"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, ChevronLeft, ChevronRight, Trash2, Filter } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { getProfilePictureUrl, getColorFromName, getAvatarLetter } from "@/lib/utils"
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
import { FilterSidebar, FilterSection, FilterField } from "./filter-sidebar"
import { SortableHeader, SortDirection } from "./sortable-header"

export function AdminRepliesTable() {
  const [replies, setReplies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState("")
  const [showFilters, setShowFilters] = useState(true)
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true)
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [replyToDelete, setReplyToDelete] = useState<any>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const [commentDetails, setCommentDetails] = useState<Record<string, { comment: string; videoId: string }>>({})
  const [videoNames, setVideoNames] = useState<Record<string, string>>({})
  const [loadingDetails, setLoadingDetails] = useState(false)
  const { toast } = useToast()
  const limit = 20

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

  const fetchCommentDetails = async (commentIds: string[]) => {
    if (commentIds.length === 0) return
    
    try {
      setLoadingDetails(true)
      const commentDetailMap: Record<string, { comment: string; videoId: string }> = {}
      
      // Fetch comment details for each unique comment ID
      await Promise.all(
        commentIds.map(async (commentId) => {
          try {
            const commentResponse = await apiClient.adminListComments({ 
              filter: commentId,
              limit: 1 
            })
            
            if (commentResponse.comments && commentResponse.comments.length > 0) {
              const comment = commentResponse.comments[0]
              const commentText = comment.comment || "No comment text"
              const videoId = comment.commented_to || comment.commentedTo || ""
              commentDetailMap[commentId] = { comment: commentText, videoId }
            } else {
              commentDetailMap[commentId] = { comment: "Comment not found", videoId: "" }
            }
          } catch (error) {
            console.error(`[admin] Failed to fetch comment ${commentId}:`, error)
            commentDetailMap[commentId] = { comment: "Error loading comment", videoId: "" }
          }
        })
      )
      
      setCommentDetails((prev) => ({ ...prev, ...commentDetailMap }))
      
      // Extract unique video IDs from comments and fetch their names
      const uniqueVideoIds = Array.from(
        new Set(
          Object.values(commentDetailMap)
            .map((c) => c.videoId)
            .filter((id): id is string => !!id)
        )
      )
      
      // Only fetch videos we don't already have
      const videosToFetch = uniqueVideoIds.filter((id) => !videoNames[id])
      if (videosToFetch.length > 0) {
        await fetchVideoNames(videosToFetch)
      }
    } catch (error) {
      console.error("[admin] Failed to fetch comment details:", error)
    } finally {
      setLoadingDetails(false)
    }
  }

  const fetchVideoNames = async (videoIds: string[]) => {
    if (videoIds.length === 0) return
    
    try {
      const videoNameMap: Record<string, string> = {}
      
      // Fetch video details for each unique video ID
      await Promise.all(
        videoIds.map(async (videoId) => {
          try {
            const videoResponse = await apiClient.adminListVideos({ 
              video_id: videoId, 
              limit: 1 
            })
            
            if (videoResponse.videos && videoResponse.videos.length > 0) {
              const video = videoResponse.videos[0]
              const title = video.video_title || video.videoTitle || "Untitled Video"
              videoNameMap[videoId] = title
            } else {
              videoNameMap[videoId] = "Video Not Found"
            }
          } catch (error) {
            console.error(`[admin] Failed to fetch video ${videoId}:`, error)
            videoNameMap[videoId] = "Error Loading"
          }
        })
      )
      
      setVideoNames((prev) => ({ ...prev, ...videoNameMap }))
    } catch (error) {
      console.error("[admin] Failed to fetch video names:", error)
    }
  }

  const fetchReplies = async () => {
    try {
      setLoading(true)
      const offset = (page - 1) * limit
      const params: any = { limit, offset, filter: filter || undefined }
      
      const response = await apiClient.adminListReplies(params)
      let repliesData = response.replies || []
      
      // Client-side sorting
      if (sortKey && sortDirection) {
        repliesData = [...repliesData].sort((a, b) => {
          let aValue: any = a[sortKey]
          let bValue: any = b[sortKey]
          
          // Handle nested properties
          if (sortKey === "replied_at") aValue = (a.replied_at || a.repliedAt) ? new Date(a.replied_at || a.repliedAt).getTime() : 0
          
          if (sortKey === "replied_at") bValue = (b.replied_at || b.repliedAt) ? new Date(b.replied_at || b.repliedAt).getTime() : 0
          
          // Handle number comparison
          const comparison = (aValue || 0) - (bValue || 0)
          return sortDirection === "asc" ? comparison : -comparison
        })
      }
      
      setReplies(repliesData)
      setTotal(response.count || 0)
      
      // Extract unique comment IDs and fetch their details
      const uniqueCommentIds = Array.from(
        new Set(
          repliesData
            .map((r) => r.replied_to || r.repliedTo)
            .filter((id): id is string => !!id)
        )
      )
      
      // Only fetch comments we don't already have
      const commentsToFetch = uniqueCommentIds.filter((id) => !commentDetails[id])
      if (commentsToFetch.length > 0) {
        await fetchCommentDetails(commentsToFetch)
      }
    } catch (error) {
      console.error("[admin] Failed to fetch replies:", error)
      toast({
        title: "Error",
        description: "Failed to fetch replies",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReplies()
  }, [page, filter, sortKey, sortDirection])

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : null)
    setSortDirection(direction)
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  const handleDeleteClick = (reply: any) => {
    setReplyToDelete(reply)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!replyToDelete) return
    const replyId = replyToDelete.reply_id || replyToDelete.replyId
    if (!replyId) return

    try {
      setDeletingReplyId(replyId)
      await apiClient.deleteReplyByReplyId(replyId)
      
      toast({
        title: "Success",
        description: "Reply deleted successfully",
      })
      
      // Refresh the list
      await fetchReplies()
    } catch (error: any) {
      console.error("[admin] Failed to delete reply:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete reply",
        variant: "destructive",
      })
    } finally {
      setDeletingReplyId(null)
      setDeleteDialogOpen(false)
      setReplyToDelete(null)
    }
  }

  if (loading && replies.length === 0) {
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
        onClear={() => { setFilter(""); setPage(1) }}
        activeFilterCount={filter ? 1 : 0}
        isCollapsed={isFilterCollapsed}
        onToggleCollapse={handleToggleCollapse}
      >
        <FilterSection title="Search">
          <FilterField 
            label="Filter Replies" 
            htmlFor="filter"
            description="Search by reply text, username, or comment text"
          >
            <Input
              id="filter"
              placeholder="Enter search term..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setPage(1)
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
              placeholder="Quick search replies..."
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setPage(1)
              }}
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
            {filter && (
              <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs">1</span>
            )}
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-background shadow-sm flex-1 min-h-0 flex flex-col">
          <div className="overflow-auto flex-1">
            <table className="w-full">
              <thead className="sticky top-0 bg-muted/50 z-10">
                <tr className="border-b">
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm sticky left-0 z-20 bg-muted/95 backdrop-blur-sm border-r">User</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">Reply</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">Comment</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">Video</th>
                  <SortableHeader
                    label="Created"
                    sortKey="replied_at"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">Actions</th>
                </tr>
              </thead>
            <tbody>
              {replies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-base font-medium">No replies found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {filter ? "Try adjusting your filter" : "No replies in the system"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                replies.map((reply) => {
                  const replyId = reply.reply_id || reply.replyId
                  const commentId = reply.replied_to || reply.repliedTo
                  const username = reply.reply_by_username || reply.reply_by
                  const replyText = reply.reply || "N/A"
                  const repliedAt = reply.replied_at || reply.repliedAt
                  
                  // Get comment details
                  const commentInfo = commentId ? commentDetails[commentId] : null
                  const commentText = commentInfo?.comment || (loadingDetails ? "Loading..." : "N/A")
                  const videoId = commentInfo?.videoId || ""
                  const videoName = videoId ? (videoNames[videoId] || (loadingDetails ? "Loading..." : "Loading...")) : null

                  return (
                    <tr key={replyId} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 sticky left-0 z-10 bg-background border-r">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getProfilePictureUrl(reply)} />
                            <AvatarFallback
                              className="text-white font-semibold"
                              style={{
                                backgroundColor: getColorFromName(username || "U"),
                              }}
                            >
                              {getAvatarLetter({ username }, "U")}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {username ? (
                              <Link
                                href={`/profile/${username}`}
                                className="text-primary hover:underline font-medium"
                              >
                                @{username}
                              </Link>
                            ) : (
                              <span className="text-muted-foreground">Unknown</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <p className="line-clamp-2 text-sm">{replyText}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {commentId ? (
                          <div className="max-w-md">
                            <p className="line-clamp-2 text-sm text-muted-foreground">
                              {commentText}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {videoId ? (
                          <Link
                            href={`/watch/${videoId}`}
                            className="text-primary hover:underline font-medium text-sm"
                          >
                            {videoName || "Loading..."}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {repliedAt
                          ? format(new Date(repliedAt), "MMM d, yyyy 'at' h:mm a")
                          : "N/A"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {videoId && (
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/watch/${videoId}`}>View</Link>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(reply)}
                            disabled={deletingReplyId === (reply.reply_id || reply.replyId)}
                            className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                          >
                            {deletingReplyId === (reply.reply_id || reply.replyId) ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
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
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t shrink-0">
            <div className="text-sm text-muted-foreground">
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} replies
            </div>
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
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reply</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this reply? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingReplyId !== null}
            >
              {deletingReplyId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

