"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, ChevronLeft, ChevronRight, Play } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { getThumbnailUrl } from "@/lib/storage"
import { format } from "date-fns"
import Link from "next/link"

export function AdminVideosTable() {
  const [videos, setVideos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const limit = 20

  const fetchVideos = async () => {
    try {
      setLoading(true)
      // Use the existing /videos/list endpoint
      const response = await apiClient.getVideoList({ page, limit })
      const videosArray = response.videos || []
      setVideos(videosArray)
      // Approximate total (since /videos/list doesn't return total, use array length)
      setTotal(videosArray.length)
    } catch (error) {
      console.error("[admin] Failed to fetch videos:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchVideos()
  }, [page])

  const filteredVideos = videos.filter((video) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      video.video_title?.toLowerCase().includes(query) ||
      video.videoTitle?.toLowerCase().includes(query) ||
      video.user_username?.toLowerCase().includes(query) ||
      video.userUsername?.toLowerCase().includes(query)
    )
  })

  const totalPages = total > 0 ? Math.ceil(total / limit) : Math.ceil(videos.length / limit)
  const hasMore = videos.length === limit // If we got a full page, there might be more

  if (loading && videos.length === 0) {
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
            placeholder="Search videos..."
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
                <th className="h-12 px-4 text-left align-middle font-medium">Thumbnail</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Title</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Creator</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Views</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Uploaded</th>
                <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-24 text-center text-muted-foreground">
                    No videos found
                  </td>
                </tr>
              ) : (
                filteredVideos.map((video) => {
                  const videoId = video.video_id || video.videoId
                  const thumbnailPath = video.video_thumbnail || video.videoThumbnail || ""
                  const thumbnailUrl = getThumbnailUrl(thumbnailPath)
                  const title = video.video_title || video.videoTitle || "Untitled"
                  const username = video.user_username || video.userUsername
                  const views = video.video_views || video.videoViews || 0
                  const createdAt = video.created_at || video.createdAt

                  return (
                    <tr key={videoId} className="border-b">
                      <td className="px-4 py-3">
                        {videoId ? (
                          <Link href={`/watch/${videoId}`} className="block group">
                            <div className="relative h-16 w-28 rounded overflow-hidden bg-muted group-hover:opacity-80 transition-opacity">
                              {thumbnailUrl ? (
                                <>
                                  <img
                                    src={thumbnailUrl}
                                    alt={title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement
                                      target.style.display = 'none'
                                    }}
                                  />
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
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
                            className="text-primary hover:underline"
                          >
                            @{username}
                          </Link>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="px-4 py-3">{views.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {createdAt
                          ? format(new Date(createdAt), "MMM d, yyyy")
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

      {(totalPages > 1 || hasMore || page > 1) && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {total > 0 ? (
              <>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} videos</>
            ) : (
              <>Showing page {page} ({videos.length} videos)</>
            )}
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
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore && videos.length < limit}
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

