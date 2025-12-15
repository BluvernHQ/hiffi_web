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

export function AdminCommentsTable() {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState("")
  const [showFilters, setShowFilters] = useState(true)
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [commentToDelete, setCommentToDelete] = useState<any>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const { toast } = useToast()
  const limit = 20

  const fetchComments = async () => {
    try {
      setLoading(true)
      const offset = (page - 1) * limit
      const params: any = { limit, offset, filter: filter || undefined }
      
      const response = await apiClient.adminListComments(params)
      let commentsData = response.comments || []
      
      // Client-side sorting
      if (sortKey && sortDirection) {
        commentsData = [...commentsData].sort((a, b) => {
          let aValue: any = a[sortKey]
          let bValue: any = b[sortKey]
          
          // Handle nested properties
          if (sortKey === "replies_count") aValue = a.replies_count || a.repliesCount || 0
          if (sortKey === "created_at") aValue = (a.created_at || a.createdAt) ? new Date(a.created_at || a.createdAt).getTime() : 0
          
          if (sortKey === "replies_count") bValue = b.replies_count || b.repliesCount || 0
          if (sortKey === "created_at") bValue = (b.created_at || b.createdAt) ? new Date(b.created_at || b.createdAt).getTime() : 0
          
          // Handle number comparison
          const comparison = (aValue || 0) - (bValue || 0)
          return sortDirection === "asc" ? comparison : -comparison
        })
      }
      
      setComments(commentsData)
      setTotal(response.count || 0)
    } catch (error) {
      console.error("[admin] Failed to fetch comments:", error)
      toast({
        title: "Error",
        description: "Failed to fetch comments",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [page, filter, sortKey, sortDirection])

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : null)
    setSortDirection(direction)
    setPage(1)
  }

  const totalPages = Math.ceil(total / limit)

  const handleDeleteClick = (comment: any) => {
    setCommentToDelete(comment)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!commentToDelete) return
    const commentId = commentToDelete.comment_id || commentToDelete.commentId
    if (!commentId) return

    try {
      setDeletingCommentId(commentId)
      await apiClient.deleteCommentByCommentId(commentId)
      
      toast({
        title: "Success",
        description: "Comment deleted successfully",
      })
      
      // Refresh the list
      await fetchComments()
    } catch (error: any) {
      console.error("[admin] Failed to delete comment:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete comment",
        variant: "destructive",
      })
    } finally {
      setDeletingCommentId(null)
      setDeleteDialogOpen(false)
      setCommentToDelete(null)
    }
  }

  if (loading && comments.length === 0) {
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
      >
        <FilterSection title="Search">
          <FilterField 
            label="Filter Comments" 
            htmlFor="filter"
            description="Search by comment_id, comment text, username, or video_id"
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
              placeholder="Quick search comments..."
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
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">User</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">Comment</th>
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">Video</th>
                  <SortableHeader
                    label="Replies"
                    sortKey="replies_count"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Created"
                    sortKey="created_at"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">Actions</th>
                </tr>
              </thead>
            <tbody>
              {comments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-base font-medium">No comments found</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        {filter ? "Try adjusting your filter" : "No comments in the system"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                comments.map((comment) => {
                  const commentId = comment.comment_id || comment.commentId
                  const videoId = comment.video_id || comment.videoId
                  const username = comment.comment_by_username || comment.comment_by
                  const commentText = comment.comment || "N/A"
                  const repliesCount = comment.replies_count || comment.repliesCount || 0

                  return (
                    <tr key={commentId} className="border-b hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={getProfilePictureUrl(comment)} />
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
                          <p className="line-clamp-2">{commentText}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {videoId ? (
                          <Link
                            href={`/watch/${videoId}`}
                            className="text-primary hover:underline"
                          >
                            View Video
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-3">{repliesCount}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {comment.created_at || comment.createdAt
                          ? format(new Date(comment.created_at || comment.createdAt), "MMM d, yyyy")
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
                            onClick={() => handleDeleteClick(comment)}
                            disabled={deletingCommentId === (comment.comment_id || comment.commentId)}
                            className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                          >
                            {deletingCommentId === (comment.comment_id || comment.commentId) ? (
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
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} comments
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
            <DialogTitle>Delete Comment</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone and will delete all associated replies.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingCommentId !== null}
            >
              {deletingCommentId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

