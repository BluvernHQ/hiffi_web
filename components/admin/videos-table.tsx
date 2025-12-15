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
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 border-2 focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="rounded-lg border-2 overflow-hidden bg-background">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 bg-muted/30">
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Thumbnail</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Title</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Creator</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Views</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Uploaded</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-base font-medium">No videos found</p>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query</p>
                    </div>
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
                    <tr 
                      key={videoId} 
                      className="border-b hover:bg-muted/30 transition-colors duration-150"
                    >
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4">
                        <div className="max-w-md">
                          <div className="font-medium line-clamp-2">{title}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
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
                      <td className="px-5 py-4">
                        {videoId && (
                          <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10">
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
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {total > 0 ? (
              <>
                Showing <span className="font-medium text-foreground">{((page - 1) * limit) + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span> videos
              </>
            ) : (
              <>
                Showing page <span className="font-medium text-foreground">{page}</span> ({videos.length} videos)
              </>
            )}
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
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore && videos.length < limit}
              className="gap-1"
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

