"use client"

import { useCallback, useEffect, useState } from "react"
import { adminApiClient } from "@/lib/admin-api-client"
import type { AdminRow } from "@/lib/admin-api-client"
import type { AdminRole } from "@/lib/auth/admin-types"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Copy, Loader2, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const ROLES: AdminRole[] = ["super_admin", "curator", "read_only"]

export function AdminsPanel() {
  const { toast } = useToast()
  const { canWrite } = useAdminPermissions()
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteResult, setInviteResult] = useState<{ id: string } | null>(null)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<AdminRole>("curator")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminApiClient.adminListAdmins({ limit: 100 })
      setAdmins(res.admins)
    } catch (err: unknown) {
      toast({
        title: "Failed to load admins",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void load()
  }, [load])

  const resetInviteForm = () => {
    setUsername("")
    setEmail("")
    setPassword("")
    setRole("curator")
    setInviteResult(null)
  }

  const handleInvite = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      toast({ title: "All fields are required", variant: "destructive" })
      return
    }
    setInviting(true)
    try {
      const res = await adminApiClient.adminInviteAdmin({
        username: username.trim(),
        email: email.trim(),
        password,
        role,
      })
      if (res.data?.id) {
        setInviteResult({ id: res.data.id })
        toast({ title: "Invite sent", description: "OTP email sent to invitee." })
        await load()
      } else {
        toast({ title: "Invite submitted" })
        setInviteOpen(false)
        resetInviteForm()
        await load()
      }
    } catch (err: unknown) {
      toast({
        title: "Invite failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setInviting(false)
    }
  }

  const inviteLink =
    typeof window !== "undefined" && inviteResult
      ? `${window.location.origin}/admin/verify-invite?id=${encodeURIComponent(inviteResult.id)}`
      : ""

  const copyInviteLink = async () => {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    toast({ title: "Link copied" })
  }

  return (
    <div className="space-y-4">
      {canWrite && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              resetInviteForm()
              setInviteOpen(true)
            }}
            className="w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Invite admin
          </Button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Username</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.admin_id} className="border-b">
                  <td className="px-4 py-3 font-medium">{a.username}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize">
                      {a.role.replace("_", " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {a.disabled ? (
                      <Badge variant="destructive">Disabled</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog
        open={inviteOpen}
        onOpenChange={(open) => {
          setInviteOpen(open)
          if (!open) resetInviteForm()
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite admin</DialogTitle>
            <DialogDescription>
              An OTP will be emailed to the invitee to verify their account.
            </DialogDescription>
          </DialogHeader>

          {inviteResult ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Share this link with the invitee to complete verification:
              </p>
              <div className="flex gap-2">
                <Input readOnly value={inviteLink} className="text-xs" />
                <Button type="button" variant="outline" size="icon" onClick={copyInviteLink}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => {
                    setInviteOpen(false)
                    resetInviteForm()
                  }}
                >
                  Done
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as AdminRole)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r} className="capitalize">
                        {r.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
                  Cancel
                </Button>
                <Button onClick={handleInvite} disabled={inviting}>
                  {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send invite"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
