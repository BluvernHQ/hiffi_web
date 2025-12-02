"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { getProfilePictureUrl, getColorFromName, getAvatarLetter } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"

export function AdminCommentsTable() {
  const [comments, setComments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const limit = 20

  const fetchComments = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAllComments(page, limit)
      setComments(response.comments || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error("[admin] Failed to fetch comments:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchComments()
  }, [page])

  const filteredComments = comments.filter((comment) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      comment.comment?.toLowerCase().includes(query) ||
      comment.comment_by?.toLowerCase().includes(query) ||
      comment.comment_by_username?.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(total / limit)

  if (loading && comments.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search comments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-left align-middle font-medium">User</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Comment</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Video</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Replies</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Created</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredComments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-muted-foreground">
                    No comments found
                  </td>
                </tr>
              ) : (
                filteredComments.map((comment) => {
                  const commentId = comment.comment_id || comment.commentId
                  const videoId = comment.video_id || comment.videoId
                  const username = comment.comment_by_username || comment.comment_by
                  const commentText = comment.comment || "N/A"
                  const repliesCount = comment.replies_count || comment.repliesCount || 0

                  return (
                    <tr key={commentId} className="border-b">
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
                        {videoId && (
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/watch/${videoId}`}>View</Link>
                          </Button>
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

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} comments
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

