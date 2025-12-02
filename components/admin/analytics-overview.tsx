"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, Video, MessageSquare, Clock, TrendingUp, Eye, Heart, Share2 } from "lucide-react"
import { apiClient } from "@/lib/api-client"

interface AnalyticsData {
  totalUsers: number
  totalVideos: number
  totalComments: number
  totalReplies: number
  totalViews: number
  totalUpvotes: number
  totalDownvotes: number
  estimatedWatchHours: number
  averageViewsPerVideo: number
  averageCommentsPerVideo: number
  engagementRate: number
}

export function AnalyticsOverview() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        
        // Fetch all data to calculate metrics
        const [usersResponse, videosResponse, commentsResponse, repliesResponse] = await Promise.all([
          apiClient.getAllUsers(1, 1000).catch(() => ({ users: [], total: 0 })),
          apiClient.getVideoList({ page: 1, limit: 1000 }).catch(() => ({ videos: [] })),
          apiClient.getAllComments(1, 1000).catch(() => ({ comments: [], total: 0 })),
          apiClient.getAllReplies(1, 1000).catch(() => ({ replies: [], total: 0 })),
        ])

        const users = usersResponse.users || []
        const videos = videosResponse.videos || []
        const comments = commentsResponse.comments || []
        const replies = repliesResponse.replies || []

        // Calculate metrics
        const totalUsers = users.length || usersResponse.total || 0
        const totalVideos = videos.length
        const totalComments = comments.length || commentsResponse.total || 0
        const totalReplies = replies.length || repliesResponse.total || 0

        // Calculate views, upvotes, downvotes
        const totalViews = videos.reduce((sum: number, video: any) => {
          return sum + (video.video_views || video.videoViews || 0)
        }, 0)

        const totalUpvotes = videos.reduce((sum: number, video: any) => {
          return sum + (video.video_upvotes || video.videoUpvotes || 0)
        }, 0)

        const totalDownvotes = videos.reduce((sum: number, video: any) => {
          return sum + (video.video_downvotes || video.videoDownvotes || 0)
        }, 0)

        // Estimate watch hours (assuming average 3 minutes per view)
        // This is a rough estimate - in production, you'd track actual watch time
        const averageWatchTimeMinutes = 3
        const estimatedWatchHours = (totalViews * averageWatchTimeMinutes) / 60

        // Calculate averages
        const averageViewsPerVideo = totalVideos > 0 ? totalViews / totalVideos : 0
        const averageCommentsPerVideo = totalVideos > 0 ? totalComments / totalVideos : 0

        // Calculate engagement rate (comments + replies + upvotes per 100 views)
        const totalEngagements = totalComments + totalReplies + totalUpvotes
        const engagementRate = totalViews > 0 ? (totalEngagements / totalViews) * 100 : 0

        setAnalytics({
          totalUsers,
          totalVideos,
          totalComments,
          totalReplies,
          totalViews,
          totalUpvotes,
          totalDownvotes,
          estimatedWatchHours,
          averageViewsPerVideo,
          averageCommentsPerVideo,
          engagementRate,
        })
      } catch (error) {
        console.error("[admin] Failed to fetch analytics:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>Unable to load analytics data</p>
      </div>
    )
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatHours = (hours: number) => {
    if (hours >= 1000) return `${(hours / 1000).toFixed(1)}K hours`
    return `${hours.toFixed(1)} hours`
  }

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalUsers)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Registered users on platform
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalVideos)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Videos uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalViews)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total video views
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Watch Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatHours(analytics.estimatedWatchHours)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Estimated watch time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Comments</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalComments)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Comments on videos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Replies</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalReplies)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Replies to comments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Upvotes</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.totalUpvotes)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Positive interactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.engagementRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Engagements per 100 views
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
            <CardDescription>Per video metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Views per Video</span>
                <span className="text-sm font-medium">{analytics.averageViewsPerVideo.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Comments per Video</span>
                <span className="text-sm font-medium">{analytics.averageCommentsPerVideo.toFixed(1)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">User Engagement</CardTitle>
            <CardDescription>Platform interaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Interactions</span>
                <span className="text-sm font-medium">
                  {formatNumber(analytics.totalComments + analytics.totalReplies + analytics.totalUpvotes)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Videos per User</span>
                <span className="text-sm font-medium">
                  {analytics.totalUsers > 0 
                    ? (analytics.totalVideos / analytics.totalUsers).toFixed(1)
                    : "0"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

