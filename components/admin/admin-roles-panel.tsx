"use client"

import { useCallback, useEffect, useState } from "react"
import { adminApiClient } from "@/lib/admin-api-client"
import type { AdminRoleRow } from "@/lib/api/admin-roles"
import { useAdminAuth } from "@/lib/admin-auth-context"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import { AdminPermissionPicker } from "@/components/admin/admin-permission-picker"
import {
  ALL_ASSIGNABLE_PERMISSIONS,
  catalogToPermissionGroups,
  FALLBACK_PERMISSION_GROUPS,
  isValidRoleKey,
  type PermissionGroup,
} from "@/lib/auth/admin-permission-catalog"
import {
  expandLegacyPermissions,
  isKnownPermission,
  type Permission,
} from "@/lib/auth/admin-permissions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type RoleDialogMode = "create" | "edit" | null

function normalizePermissions(permissions: string[]): Permission[] {
  const expanded = expandLegacyPermissions(permissions)
  const allowed = new Set(ALL_ASSIGNABLE_PERMISSIONS)
  return expanded.filter((p): p is Permission => allowed.has(p) || isKnownPermission(p))
}

export function AdminRolesPanel() {
  const { toast } = useToast()
  const { patchAdminSession } = useAdminAuth()
  const { admin: currentAdmin, canRolesWrite } = useAdminPermissions()
  const [roles, setRoles] = useState<AdminRoleRow[]>([])
  const [permissionGroups, setPermissionGroups] = useState<PermissionGroup[]>(
    FALLBACK_PERMISSION_GROUPS,
  )
  const [loading, setLoading] = useState(true)
  const [dialogMode, setDialogMode] = useState<RoleDialogMode>(null)
  const [saving, setSaving] = useState(false)
  const [deletingRole, setDeletingRole] = useState<AdminRoleRow | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [roleKey, setRoleKey] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [editingRole, setEditingRole] = useState<AdminRoleRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rolesRes, catalogRes] = await Promise.all([
        adminApiClient.adminListRoles(),
        adminApiClient.adminGetPermissionsCatalog().catch(() => null),
      ])
      setRoles(rolesRes.roles)
      if (catalogRes?.modules?.length) {
        const groups = catalogToPermissionGroups(catalogRes)
        if (groups.length > 0) setPermissionGroups(groups)
      }
    } catch (err: unknown) {
      toast({
        title: "Failed to load roles",
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

  const resetForm = () => {
    setRoleKey("")
    setDisplayName("")
    setPermissions([])
    setEditingRole(null)
  }

  const openCreate = () => {
    resetForm()
    setDialogMode("create")
  }

  const openEdit = (role: AdminRoleRow) => {
    setEditingRole(role)
    setRoleKey(role.role_key)
    setDisplayName(role.display_name)
    setPermissions(normalizePermissions(role.permissions))
    setDialogMode("edit")
  }

  const closeDialog = () => {
    setDialogMode(null)
    resetForm()
  }

  const handleSave = async () => {
    const name = displayName.trim()
    if (!name) {
      toast({ title: "Display name is required", variant: "destructive" })
      return
    }
    if (permissions.length === 0) {
      toast({ title: "Select at least one permission", variant: "destructive" })
      return
    }

    if (dialogMode === "create") {
      const key = roleKey.trim().toLowerCase()
      if (!isValidRoleKey(key)) {
        toast({
          title: "Invalid role key",
          description: "Use 3–30 lowercase characters: start with a letter, then letters, numbers, or underscores.",
          variant: "destructive",
        })
        return
      }
    }

    setSaving(true)
    try {
      if (dialogMode === "create") {
        const key = roleKey.trim().toLowerCase()
        await adminApiClient.adminCreateRole({
          role_key: key,
          display_name: name,
          permissions,
        })
        toast({ title: "Role created" })
      } else if (dialogMode === "edit" && editingRole) {
        await adminApiClient.adminUpdateRole(editingRole.role_key, {
          display_name: name,
          permissions,
        })
        if (currentAdmin?.role === editingRole.role_key) {
          patchAdminSession({ permissions })
        }
        toast({ title: "Role updated" })
      }
      closeDialog()
      await load()
    } catch (err: unknown) {
      toast({
        title: dialogMode === "create" ? "Create failed" : "Update failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingRole) return
    setDeleting(true)
    try {
      await adminApiClient.adminDeleteRole(deletingRole.role_key)
      toast({ title: "Role deleted" })
      setDeletingRole(null)
      await load()
    } catch (err: unknown) {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      {canRolesWrite ? (
        <div className="flex justify-end">
          <Button onClick={openCreate} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Create role
          </Button>
        </div>
      ) : null}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Key</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Permissions</th>
                {canRolesWrite ? (
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.role_key} className="border-b align-top">
                  <td className="px-4 py-3 font-medium">{role.display_name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{role.role_key}</td>
                  <td className="px-4 py-3">
                    <Badge variant={role.is_system ? "secondary" : "outline"}>
                      {role.is_system ? "System" : "Custom"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-md">
                    {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"}
                  </td>
                  {canRolesWrite ? (
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openEdit(role)}
                          disabled={role.is_system}
                          title={role.is_system ? "System roles cannot be edited" : "Edit role"}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingRole(role)}
                          disabled={role.is_system}
                          title={role.is_system ? "System roles cannot be deleted" : "Delete role"}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{dialogMode === "create" ? "Create custom role" : "Edit role"}</DialogTitle>
            <DialogDescription>
              {dialogMode === "create"
                ? "Define a new role with a unique key and permission set."
                : "Update the display name and permissions for this custom role."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {dialogMode === "create" ? (
              <div className="space-y-2">
                <Label htmlFor="role-key">Role key</Label>
                <Input
                  id="role-key"
                  value={roleKey}
                  onChange={(e) => setRoleKey(e.target.value.toLowerCase())}
                  placeholder="content_mod"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase, 3–30 characters, starts with a letter (a–z, 0–9, _).
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <Label>Role key</Label>
                <p className="text-sm font-mono text-muted-foreground">{roleKey}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="role-display-name">Display name</Label>
              <Input
                id="role-display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Content Moderator"
              />
            </div>

            <div className="space-y-2">
              <Label>Permissions</Label>
              <AdminPermissionPicker
                value={permissions}
                onChange={setPermissions}
                groups={permissionGroups}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save role"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deletingRole !== null} onOpenChange={(open) => !open && setDeletingRole(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete role</DialogTitle>
            <DialogDescription>
              Delete &ldquo;{deletingRole?.display_name}&rdquo;? Team members assigned this role may lose access until
              reassigned.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingRole(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
