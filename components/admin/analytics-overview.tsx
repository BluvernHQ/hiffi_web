"use client"

import { useState, useEffect, type ReactNode } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Users, Video, MessageSquare, Clock, TrendingUp, Eye, Heart, RefreshCw, RotateCcw } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { useToast } from "@/hooks/use-toast"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { cn } from "@/lib/utils"

interface AnalyticsData {
  totalUsers: number
  organicUsers: number
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

function adminSectionHref(section: string, extra?: Record<string, string>) {
  const params = new URLSearchParams({ section })
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) params.set(key, value)
    }
  }
  return `/admin/dashboard?${params.toString()}`
}

function MetricCard({
  href,
  title,
  value,
  description,
  icon,
  iconClassName,
}: {
  href?: string
  title: string
  value: ReactNode
  description: ReactNode
  icon: ReactNode
  iconClassName?: string
}) {
  const card = (
    <Card
      className={cn(
        "border-2 transition-all duration-200 group h-full",
        href
          ? "hover:shadow-lg hover:border-primary/40 cursor-pointer focus-within:ring-2 focus-within:ring-primary/40"
          : "hover:shadow-lg hover:border-primary/20",
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-semibold text-muted-foreground">{title}</CardTitle>
        <div
          className={cn(
            "h-9 w-9 rounded-lg flex items-center justify-center transition-colors",
            iconClassName ?? "bg-primary/10 group-hover:bg-primary/20",
          )}
        >
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {href ? (
          <p className="mt-2 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
            View list →
          </p>
        ) : null}
      </CardContent>
    </Card>
  )

  if (!href) return card
  return (
    <Link href={href} className="block rounded-xl outline-none" aria-label={`View ${title}`}>
      {card}
    </Link>
  )
}

export function AnalyticsOverview() {
  const { canWrite } = useAdminPermissions()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [resyncing, setResyncing] = useState(false)
  const [resyncDialogOpen, setResyncDialogOpen] = useState(false)
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } = useAdminNetworkError()

  const fetchAnalytics = async () => {
    if (guardOfflineBeforeFetch()) {
      setAnalytics(null)
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
        
        // Fetch counters from API - get raw values from counters endpoint
        const countersResponse = await adminApiClient.adminCounters()
        
        if (!countersResponse.success) {
          throw new Error("Failed to fetch counters")
        }
        
        const counters = countersResponse.counters
        
        // Get raw values from counters endpoint only - no fallbacks to ensure consistency
        const totalUsers = counters.users || 0
        const organicUsers = counters.organic_users || 0
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
          organicUsers,
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
        setAnalytics(null)
        handleFetchError(error)
      } finally {
        setLoading(false)
      }
  }

  useEffect(() => {
    void fetchAnalytics()
  }, [])

  const handleResyncCounters = async () => {
    if (guardOfflineBeforeFetch()) return
    try {
      setResyncing(true)
      const result = await adminApiClient.adminResyncCounters()
      if (result.success) {
        toast({
          title: "Counters resynced",
          description: result.message || "Platform counters have been recalculated from database counts.",
        })
        setResyncDialogOpen(false)
        await fetchAnalytics()
      } else {
        throw new Error(result.message || "Failed to resync counters")
      }
    } catch (error) {
      handleFetchError(error, {
        genericMessage: "Failed to resync counters",
        onGenericError: (description) => toast({ title: "Error", description, variant: "destructive" }),
      })
    } finally {
      setResyncing(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Key Metrics Grid Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="h-4 w-24 bg-muted rounded animate-shimmer" />
                <div className="h-9 w-9 rounded-lg bg-muted animate-shimmer" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted rounded animate-shimmer mb-2" />
                <div className="h-3 w-32 bg-muted rounded animate-shimmer" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Engagement Metrics Skeleton */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="h-4 w-24 bg-muted rounded animate-shimmer" />
                <div className="h-9 w-9 rounded-lg bg-muted animate-shimmer" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-20 bg-muted rounded animate-shimmer mb-2" />
                <div className="h-3 w-32 bg-muted rounded animate-shimmer" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Performance Metrics Skeleton */}
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="border-2">
              <CardHeader className="pb-4">
                <div className="h-5 w-32 bg-muted rounded animate-shimmer mb-2" />
                <div className="h-3 w-24 bg-muted rounded animate-shimmer" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, j) => (
                    <div key={j} className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0">
                      <div className="flex items-center justify-between">
                        <div className="h-4 w-32 bg-muted rounded animate-shimmer" />
                        <div className="h-5 w-16 bg-muted rounded animate-shimmer" />
                      </div>
                      <div className="h-3 w-40 bg-muted rounded animate-shimmer" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) {
    if (networkError) {
      return (
        <AdminOfflineState
          message={networkError}
          onRetry={() => {
            clearNetworkError()
            void fetchAnalytics()
          }}
        />
      )
    }
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        {analytics.lastUpdated && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw className="h-4 w-4" />
            <span>
              Last updated {formatDistanceToNow(new Date(analytics.lastUpdated), { addSuffix: true })}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2 ml-auto">
          <Button variant="outline" size="sm" onClick={() => void fetchAnalytics()} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
          {canWrite && (
          <Button variant="outline" size="sm" onClick={() => setResyncDialogOpen(true)} disabled={resyncing}>
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Resync counters
          </Button>
          )}
        </div>
      </div>
      
      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <MetricCard
          href={adminSectionHref("users")}
          title="Total Users"
          value={formatNumber(analytics.totalUsers)}
          description="All accounts (organic + inventory)"
          icon={<Users className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          href={adminSectionHref("users", { source: "organic" })}
          title="Organic Users"
          value={formatNumber(analytics.organicUsers)}
          description={
            <>
              Self-serve signups
              {analytics.totalUsers > 0
                ? ` · ${((analytics.organicUsers / analytics.totalUsers) * 100).toFixed(1)}% of total`
                : ""}
            </>
          }
          icon={<Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />}
          iconClassName="bg-emerald-500/10 group-hover:bg-emerald-500/20"
        />
        <MetricCard
          href={adminSectionHref("videos")}
          title="Total Videos"
          value={formatNumber(analytics.totalVideos)}
          description="Videos uploaded"
          icon={<Video className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          href={adminSectionHref("videos")}
          title="Total Views"
          value={formatNumber(analytics.totalViews)}
          description="Total video views"
          icon={<Eye className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Watch Hours"
          value={formatHours(analytics.estimatedWatchHours)}
          description={
            analytics.isWatchHoursEstimated
              ? "Estimated: views × 3 minutes per view"
              : "Total watch time across all videos"
          }
          icon={<Clock className="h-4 w-4 text-primary" />}
        />
      </div>

      {/* Engagement Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          href={adminSectionHref("comments")}
          title="Total Comments"
          value={formatNumber(analytics.totalComments)}
          description="Comments on videos"
          icon={<MessageSquare className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          href={adminSectionHref("replies")}
          title="Total Replies"
          value={formatNumber(analytics.totalReplies)}
          description="Replies to comments"
          icon={<MessageSquare className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Total Upvotes"
          value={formatNumber(analytics.totalUpvotes)}
          description="Positive interactions"
          icon={<Heart className="h-4 w-4 text-primary" />}
        />
        <MetricCard
          title="Engagement Rate"
          value={`~${analytics.engagementRate.toFixed(1)}%`}
          description="(Comments + Replies + Upvotes) ÷ Views × 100"
          icon={<TrendingUp className="h-4 w-4 text-primary" />}
        />
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
              <Link
                href={adminSectionHref("users", { source: "organic" })}
                className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0 rounded-md -mx-1 px-1 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Organic Users</span>
                  <span className="text-base font-semibold text-primary">
                    {formatNumber(analytics.organicUsers)} →
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70">Self-serve auth signups · open filtered list</p>
              </Link>
              <Link
                href={adminSectionHref("users", { source: "inventory" })}
                className="flex flex-col gap-1 py-2 border-b border-border/50 last:border-0 rounded-md -mx-1 px-1 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Inventory Users</span>
                  <span className="text-base font-semibold text-primary">
                    {formatNumber(Math.max(0, analytics.totalUsers - analytics.organicUsers))} →
                  </span>
                </div>
                <p className="text-xs text-muted-foreground/70">Seeded artists · open filtered list</p>
              </Link>
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

      <Dialog open={resyncDialogOpen} onOpenChange={setResyncDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resync platform counters?</DialogTitle>
            <DialogDescription>
              This recalculates all counters from actual table counts. Use if counters may be out of sync after direct
              database changes. This may take longer on large datasets.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResyncDialogOpen(false)} disabled={resyncing}>
              Cancel
            </Button>
            <Button onClick={() => void handleResyncCounters()} disabled={resyncing}>
              {resyncing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resyncing…
                </>
              ) : (
                "Resync counters"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

