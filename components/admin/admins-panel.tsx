"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { adminApiClient } from "@/lib/admin-api-client"
import type { AdminRow } from "@/lib/admin-api-client"
import type { AdminRoleRow } from "@/lib/api/admin-roles"
import { rolesAssignableToAdmin } from "@/lib/auth/admin-permission-catalog"
import { useAdminAuth } from "@/lib/admin-auth-context"
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
import { Loader2, Pencil, UserPlus, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function AdminsPanel() {
  const { toast } = useToast()
  const { patchAdminSession } = useAdminAuth()
  const { admin: currentAdmin, canAdminsWrite } = useAdminPermissions()
  const [admins, setAdmins] = useState<AdminRow[]>([])
  const [roles, setRoles] = useState<AdminRoleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showInvitePassword, setShowInvitePassword] = useState(false)
  const [role, setRole] = useState("")

  const [editOpen, setEditOpen] = useState(false)
  const [editingAdmin, setEditingAdmin] = useState<AdminRow | null>(null)
  const [editRole, setEditRole] = useState("")
  const [editDisabled, setEditDisabled] = useState(false)
  const [editPassword, setEditPassword] = useState("")
  const [showEditPassword, setShowEditPassword] = useState(false)
  const [savingEdit, setSavingEdit] = useState(false)

  const assignableRoles = useMemo(
    () => rolesAssignableToAdmin(roles, currentAdmin),
    [roles, currentAdmin],
  )

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [adminsRes, rolesRes] = await Promise.all([
        adminApiClient.adminListAdmins({ limit: 100 }),
        adminApiClient.adminListRoles(),
      ])
      setAdmins(adminsRes.admins)
      setRoles(rolesRes.roles)
      setRole((current) => current || rolesRes.roles[0]?.role_key || "")
    } catch (err: unknown) {
      toast({
        title: "Failed to load team",
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
    setShowInvitePassword(false)
    setRole(assignableRoles[0]?.role_key ?? roles[0]?.role_key ?? "")
  }

  const openEdit = (row: AdminRow) => {
    setEditingAdmin(row)
    setEditRole(row.role)
    setEditDisabled(Boolean(row.disabled))
    setEditPassword("")
    setShowEditPassword(false)
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditingAdmin(null)
    setEditPassword("")
    setShowEditPassword(false)
  }

  const handleInvite = async () => {
    if (!username.trim() || !email.trim() || !password.trim() || !role) {
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
      if (!res.success) {
        throw new Error("Invite failed")
      }
      const message =
        res.data?.message ||
        `${res.data?.username ?? username.trim()} can sign in at /admin with the password you set.`
      toast({
        title: "Team member created",
        description: message,
      })
      setInviteOpen(false)
      resetInviteForm()
      await load()
    } catch (err: unknown) {
      toast({
        title: "Create failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setInviting(false)
    }
  }

  const handleSaveEdit = async () => {
    if (!editingAdmin || !editRole) return
    const isSelf = currentAdmin?.admin_id === editingAdmin.admin_id
    if (isSelf && editDisabled) {
      toast({ title: "You cannot disable your own account", variant: "destructive" })
      return
    }

    const trimmedPassword = editPassword.trim()
    if (trimmedPassword && trimmedPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" })
      return
    }

    setSavingEdit(true)
    try {
      await adminApiClient.adminUpdateAdmin(editingAdmin.admin_id, {
        role: editRole,
        disabled: editDisabled,
        ...(trimmedPassword ? { password: trimmedPassword } : {}),
      })
      if (isSelf) {
        const roleRow = roles.find((r) => r.role_key === editRole)
        patchAdminSession({
          role: editRole,
          ...(roleRow ? { permissions: roleRow.permissions } : {}),
        })
      }
      toast({
        title: "Team member updated",
        description: trimmedPassword
          ? "Login password was reset. They can sign in at /admin with the new password."
          : undefined,
      })
      closeEdit()
      await load()
    } catch (err: unknown) {
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSavingEdit(false)
    }
  }

  const isEditingSelf = currentAdmin?.admin_id === editingAdmin?.admin_id

  return (
    <div className="space-y-4">
      {canAdminsWrite && (
        <div className="flex justify-end">
          <Button
            onClick={() => {
              resetInviteForm()
              setInviteOpen(true)
            }}
            className="w-full sm:w-auto"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add team member
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
                {canAdminsWrite ? (
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.admin_id} className="border-b">
                  <td className="px-4 py-3 font-medium">{a.username}</td>
                  <td className="px-4 py-3">{a.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize">
                      {a.role.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {a.disabled ? (
                      <Badge variant="destructive">Disabled</Badge>
                    ) : (
                      <Badge variant="outline">Active</Badge>
                    )}
                  </td>
                  {canAdminsWrite ? (
                    <td className="px-4 py-3 text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => openEdit(a)}>
                        <Pencil className="h-3.5 w-3.5 mr-1.5" />
                        Edit
                      </Button>
                    </td>
                  ) : null}
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
            <DialogTitle>Add team member</DialogTitle>
            <DialogDescription>
              The account is created immediately. They sign in at /admin with the username and password
              you set below.
            </DialogDescription>
          </DialogHeader>

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
              <div className="relative">
                <Input
                  type={showInvitePassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowInvitePassword(!showInvitePassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showInvitePassword ? "Hide password" : "Show password"}
                >
                  {showInvitePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={assignableRoles.length === 0}
              >
                {assignableRoles.map((r) => (
                  <option key={r.role_key} value={r.role_key}>
                    {r.display_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)} disabled={inviting}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={inviting || assignableRoles.length === 0}>
              {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit team member</DialogTitle>
            <DialogDescription>
              Update role, password, or account status. Changing your own role updates this
              session immediately; other admins need to sign in again to pick up permission changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {editingAdmin ? (
              <div className="rounded-lg border bg-muted/40 px-4 py-3">
                <p className="text-sm font-medium">{editingAdmin.username}</p>
                <p className="text-sm text-muted-foreground">{editingAdmin.email}</p>
              </div>
            ) : null}

            <div className="space-y-2">
              <Label>Role</Label>
              <select
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={assignableRoles.length === 0}
              >
                {assignableRoles.map((r) => (
                  <option key={r.role_key} value={r.role_key}>
                    {r.display_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Account status</Label>
              <select
                value={editDisabled ? "disabled" : "active"}
                onChange={(e) => setEditDisabled(e.target.value === "disabled")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={isEditingSelf}
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
              {isEditingSelf ? (
                <p className="text-xs text-muted-foreground">You cannot disable your own account.</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">New password</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showEditPassword ? "text" : "password"}
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={showEditPassword ? "Hide password" : "Show password"}
                >
                  {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">Minimum 6 characters when set.</p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={savingEdit}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={savingEdit || !editRole}>
              {savingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
