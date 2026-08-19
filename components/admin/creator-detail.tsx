"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Loader2, PauseCircle, PlayCircle } from "lucide-react"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { adminApiClient } from "@/lib/admin-api-client"
import { useAdminNetworkError } from "@/hooks/use-admin-network-error"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { AdminOfflineState } from "@/components/admin/admin-offline-state"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { creatorsDashboardHref } from "@/lib/admin/creator-nav"
import { getThumbnailUrl } from "@/lib/storage"
import { AuthenticatedImage } from "@/components/video/authenticated-image"
import type { CreatorDetail } from "@/lib/types/admin-creators"

function when(value?: string | null) {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "—"
  return format(date, "MMM d, yyyy · h:mm a")
}

export function CreatorDetail({ username }: { username: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { canWrite } = useAdminPermissions()
  const { toast } = useToast()
  const { networkError, clearNetworkError, guardOfflineBeforeFetch, handleFetchError } =
    useAdminNetworkError()
  const [detail, setDetail] = useState<CreatorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [confirm, setConfirm] = useState<"suspend" | "unsuspend" | null>(null)

  const backHref = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString())
    next.set("section", "creators")
    next.delete("creator")
    if (!next.get("creators_view") && !next.get("segment") && !next.get("status")) {
      next.set("creators_view", "directory")
    }
    return `/admin/dashboard?${next.toString()}`
  }, [searchParams])

  const load = async () => {
    if (guardOfflineBeforeFetch()) {
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      clearNetworkError()
      setDetail(await adminApiClient.adminGetCreator(username))
    } catch (error) {
      setDetail(null)
      handleFetchError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username])

  const onConfirm = async () => {
    if (!confirm) return
    try {
      setActing(true)
      if (confirm === "suspend") await adminApiClient.adminSuspendCreator(username)
      else await adminApiClient.adminUnsuspendCreator(username)
      toast({
        title: confirm === "suspend" ? "Creator suspended" : "Creator unsuspended",
        description:
          confirm === "suspend"
            ? "Uploads are blocked. Login still works and existing videos stay visible."
            : "They can upload again.",
      })
      setConfirm(null)
      await load()
    } catch (error) {
      const isOffline = handleFetchError(error)
      if (!isOffline) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message : "Action failed",
          variant: "destructive",
        })
      }
    } finally {
      setActing(false)
    }
  }

  if (loading && !detail) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" />
        Loading creator…
      </div>
    )
  }

  if (!detail) {
    if (networkError) {
      return (
        <AdminOfflineState
          message={networkError}
          onRetry={() => {
            clearNetworkError()
            void load()
          }}
        />
      )
    }
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href={backHref}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <p className="text-sm text-muted-foreground">Creator not found.</p>
      </div>
    )
  }

  const { profile, activity_summary: summary, upload_activity: uploads } = detail
  const weekly = uploads.timeline_weekly.map((row) => ({
    ...row,
    label: row.week ? format(parseISO(row.week), "MMM d") : row.week,
  }))
  const monthly = uploads.timeline_monthly.map((row) => ({
    ...row,
    label: row.month ? format(parseISO(row.month), "MMM yyyy") : row.month,
  }))
  const canSuspend = canWrite && profile.creator_status === "approved"
  const canUnsuspend = canWrite && profile.creator_status === "suspended"

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="ghost" size="icon" onClick={() => router.push(backHref)} aria-label="Back">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <ProfilePicture user={profile} size="lg" />
          <div className="min-w-0">
            <h2 className="text-xl font-semibold truncate">{profile.name}</h2>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={profile.creator_status === "suspended" ? "destructive" : "secondary"}>
                {profile.creator_status === "approved"
                  ? "Creator"
                  : profile.creator_status === "applied"
                    ? "OTP pending"
                    : profile.creator_status}
              </Badge>
              {profile.disabled && <Badge variant="destructive">Account disabled</Badge>}
              {profile.claim_status && <Badge variant="outline">Claim {profile.claim_status}</Badge>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {canSuspend && (
            <Button variant="outline" onClick={() => setConfirm("suspend")}>
              <PauseCircle className="h-4 w-4 mr-1.5" />
              Suspend uploads
            </Button>
          )}
          {canUnsuspend && (
            <Button onClick={() => setConfirm("unsuspend")}>
              <PlayCircle className="h-4 w-4 mr-1.5" />
              Unsuspend
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Videos" value={String(summary.total_videos)} />
        <Stat label="Followers" value={String(profile.followers)} />
        <Stat
          label="Days since last upload"
          value={summary.days_since_last_upload == null ? "—" : String(summary.days_since_last_upload)}
        />
        <Stat
          label="Days since last activity"
          value={summary.days_since_last_activity == null ? "—" : String(summary.days_since_last_activity)}
        />
      </div>

      <Card className="border-2">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
          <Field label="Email" value={profile.email} />
          <Field label="City" value={profile.city} />
          <Field label="Genre" value={profile.genre} />
          <Field label="Joined" value={when(profile.created_at)} />
          <Field label="Applied" value={when(profile.applied_at)} />
          <Field label="Became a creator" value={when(profile.approved_at)} />
          <Field label="Suspended" value={when(profile.suspended_at)} />
          <Field label="First upload" value={when(summary.first_upload)} />
          <Field label="Last upload" value={when(summary.last_upload)} />
          <Field label="Last login" value={when(summary.last_login)} />
          <Field label="Last activity" value={when(summary.last_activity)} />
          {profile.bio && (
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Bio</p>
              <p className="mt-1 whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Weekly uploads</CardTitle>
          <CardDescription>Weeks returned by the API (zeros omitted)</CardDescription>
        </CardHeader>
        <CardContent>
          {weekly.length === 0 ? (
            <p className="text-sm text-muted-foreground">No weekly points.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekly}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Uploads" fill="#ED1C2F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="border-2">
        <CardHeader>
          <CardTitle>Monthly uploads</CardTitle>
          <CardDescription>Months returned by the API (zeros omitted)</CardDescription>
        </CardHeader>
        <CardContent>
          {monthly.length === 0 ? (
            <p className="text-sm text-muted-foreground">No monthly points.</p>
          ) : (
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthly}>
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Uploads" fill="#1A1A1A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Recent videos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploads.recent_videos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No published videos.</p>
            ) : (
              uploads.recent_videos.map((video) => {
                const thumbnailUrl = getThumbnailUrl(video.video_thumbnail || "")
                return (
                  <div key={video.video_id} className="flex gap-3">
                    <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded bg-muted">
                      {thumbnailUrl ? (
                        <AuthenticatedImage
                          src={thumbnailUrl}
                          alt=""
                          fill
                          className="object-cover"
                          authenticated={false}
                          sizes="96px"
                        />
                      ) : null}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{video.video_title}</p>
                      <p className="text-xs text-muted-foreground">
                        {video.status} · {when(video.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Encoding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploads.encoding_videos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing encoding.</p>
            ) : (
              uploads.encoding_videos.map((video) => (
                <div key={video.video_id}>
                  <p className="font-medium truncate">{video.video_title}</p>
                  <p className="text-xs text-muted-foreground">{when(video.created_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>OTP upgrades</CardTitle>
            <CardDescription>Organic upgrade history only</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.applications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No OTP applications on file.</p>
            ) : (
              detail.applications.map((app) => (
                <div key={app.id} className="rounded-md border p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium capitalize">{app.status}</p>
                    <p className="text-xs text-muted-foreground">{when(app.created_at)}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{app.source}</p>
                  {app.otp_id && <p className="text-xs text-muted-foreground">OTP {app.otp_id}</p>}
                  {app.expires_at && (
                    <p className="text-xs text-muted-foreground">Expires {when(app.expires_at)}</p>
                  )}
                  {app.decided_at && (
                    <p className="text-xs text-muted-foreground">Decided {when(app.decided_at)}</p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Reports</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {detail.flags.length === 0 ? (
              <p className="text-sm text-muted-foreground">No flags targeting this creator or their videos.</p>
            ) : (
              detail.flags.map((flag) => (
                <Link
                  key={flag.id}
                  href={`/admin/dashboard?section=flags&flagId=${encodeURIComponent(flag.id)}`}
                  className="block rounded-md border p-3 hover:border-primary/40"
                >
                  <p className="font-medium text-sm">{flag.reason || flag.report_type}</p>
                  <p className="text-xs text-muted-foreground">
                    {flag.status} · {flag.reference_id} · {when(flag.created_at)}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={confirm != null} onOpenChange={(open) => !open && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirm === "suspend" ? "Suspend this creator?" : "Unsuspend this creator?"}</DialogTitle>
            <DialogDescription>
              {confirm === "suspend"
                ? "This blocks new uploads. Login still works and existing videos stay visible. It is not the same as disabling the account."
                : "This restores upload access for the creator."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)} disabled={acting}>
              Cancel
            </Button>
            <Button onClick={() => void onConfirm()} disabled={acting}>
              {acting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5">{value || "—"}</p>
    </div>
  )
}
