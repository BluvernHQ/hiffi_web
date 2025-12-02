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

export function AdminRepliesTable() {
  const [replies, setReplies] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const limit = 20

  const fetchReplies = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAllReplies(page, limit)
      setReplies(response.replies || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error("[admin] Failed to fetch replies:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReplies()
  }, [page])

  const filteredReplies = replies.filter((reply) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      reply.reply?.toLowerCase().includes(query) ||
      reply.reply_by?.toLowerCase().includes(query) ||
      reply.reply_by_username?.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(total / limit)

  if (loading && replies.length === 0) {
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
            placeholder="Search replies..."
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
                <th className="h-12 px-4 text-left align-middle font-medium">Reply</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Comment</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Video</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Created</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredReplies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-muted-foreground">
                    No replies found
                  </td>
                </tr>
              ) : (
                filteredReplies.map((reply) => {
                  const replyId = reply.reply_id || reply.replyId
                  const commentId = reply.comment_id || reply.commentId
                  const videoId = reply.video_id || reply.videoId
                  const username = reply.reply_by_username || reply.reply_by
                  const replyText = reply.reply || "N/A"

                  return (
                    <tr key={replyId} className="border-b">
                      <td className="px-4 py-3">
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
                          <p className="line-clamp-2">{replyText}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {commentId ? (
                          <span className="text-sm text-muted-foreground">
                            Comment #{commentId.slice(0, 8)}
                          </span>
                        ) : (
                          "N/A"
                        )}
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
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {reply.created_at || reply.createdAt
                          ? format(new Date(reply.created_at || reply.createdAt), "MMM d, yyyy")
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
            Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} replies
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

