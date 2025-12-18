"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, Video, MessageSquare, Clock, TrendingUp, Eye, Heart, Share2, RefreshCw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
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
  isWatchHoursEstimated: boolean
  averageViewsPerVideo: number
  averageCommentsPerVideo: number
  engagementRate: number
  lastUpdated?: string
}

export function AnalyticsOverview() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        
        // Fetch counters from API - get raw values from counters endpoint
        const countersResponse = await apiClient.adminCounters()
        
        if (!countersResponse.success) {
          throw new Error("Failed to fetch counters")
        }
        
        const counters = countersResponse.counters
        
        // Get raw values from counters endpoint only - no fallbacks to ensure consistency
        const totalUsers = counters.users || 0
        const totalVideos = counters.videos || 0
        const totalComments = counters.comments || 0
        const totalReplies = counters.replies || 0
        const totalUpvotes = counters.upvotes || 0
        const totalDownvotes = counters.downvotes || 0
        
        // Get views from counters only - if not available, use 0
        const totalViews = counters.views || 0
        
        // Get watch hours from counters only - if not available, calculate from views
        // Only calculate if we have views from counters
        let estimatedWatchHours = counters.watch_hours
        let isWatchHoursEstimated = false
        if ((estimatedWatchHours === undefined || estimatedWatchHours === null) && totalViews > 0) {
          // Estimate: assuming average 3 minutes per view
          const averageWatchTimeMinutes = 3
          estimatedWatchHours = (totalViews * averageWatchTimeMinutes) / 60
          isWatchHoursEstimated = true
        } else if (estimatedWatchHours === undefined || estimatedWatchHours === null) {
          estimatedWatchHours = 0
        }

        // Calculate averages from raw counter values
        const averageViewsPerVideo = totalVideos > 0 ? totalViews / totalVideos : 0
        const averageCommentsPerVideo = totalVideos > 0 ? totalComments / totalVideos : 0

        // Calculate engagement rate from raw counter values
        // (comments + replies + upvotes per 100 views)
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
          isWatchHoursEstimated,
          averageViewsPerVideo,
          averageCommentsPerVideo,
          engagementRate,
          lastUpdated: counters.updated_at,
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
      {/* Last Updated Indicator */}
      {analytics.lastUpdated && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4" />
          <span>
            Last updated {formatDistanceToNow(new Date(analytics.lastUpdated), { addSuffix: true })}
          </span>
        </div>
      )}
      
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Users</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight mb-1">{formatNumber(analytics.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              Registered users on platform
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Videos</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Video className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight mb-1">{formatNumber(analytics.totalVideos)}</div>
            <p className="text-xs text-muted-foreground">
              Videos uploaded
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Views</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Eye className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight mb-1">{formatNumber(analytics.totalViews)}</div>
            <p className="text-xs text-muted-foreground">
              Total video views
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Watch Hours</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Clock className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight mb-1">
              {formatHours(analytics.estimatedWatchHours)}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.isWatchHoursEstimated 
                ? "Estimated: views × 3 minutes per view"
                : "Total watch time across all videos"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Engagement Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Comments</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight mb-1">{formatNumber(analytics.totalComments)}</div>
            <p className="text-xs text-muted-foreground">
              Comments on videos
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Replies</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight mb-1">{formatNumber(analytics.totalReplies)}</div>
            <p className="text-xs text-muted-foreground">
              Replies to comments
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Total Upvotes</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Heart className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight mb-1">{formatNumber(analytics.totalUpvotes)}</div>
            <p className="text-xs text-muted-foreground">
              Positive interactions
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200 hover:border-primary/20 group">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground">Engagement Rate</CardTitle>
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight mb-1">~{analytics.engagementRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              (Comments + Replies + Upvotes) ÷ Views × 100
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Average Performance</CardTitle>
            <CardDescription className="text-xs">Per video metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Views per Video</span>
                  <span className="text-base font-semibold">~{analytics.averageViewsPerVideo.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground/70">Total Views ÷ Total Videos</p>
              </div>
              <div className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Avg. Comments per Video</span>
                  <span className="text-base font-semibold">~{analytics.averageCommentsPerVideo.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground/70">Total Comments ÷ Total Videos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:shadow-lg transition-all duration-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">User Engagement</CardTitle>
            <CardDescription className="text-xs">Platform interaction metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Interactions</span>
                  <span className="text-base font-semibold">
                    {formatNumber(analytics.totalComments + analytics.totalReplies + analytics.totalUpvotes)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70">Comments + Replies + Upvotes</p>
              </div>
              <div className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Videos per User</span>
                  <span className="text-base font-semibold">
                    {analytics.totalUsers > 0 
                      ? `~${(analytics.totalVideos / analytics.totalUsers).toFixed(1)}`
                      : "0"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70">Total Videos ÷ Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

