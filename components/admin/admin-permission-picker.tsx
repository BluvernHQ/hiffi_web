"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  ADMIN_PERMISSION_GROUPS,
  permissionsForGroup,
  type PermissionOption,
} from "@/lib/auth/admin-permission-catalog"
import type { Permission } from "@/lib/auth/admin-permissions"
import { cn } from "@/lib/utils"

type AdminPermissionPickerProps = {
  value: Permission[]
  onChange: (permissions: Permission[]) => void
  disabled?: boolean
  className?: string
}

function togglePermission(
  current: Permission[],
  perm: Permission,
  checked: boolean,
): Permission[] {
  if (checked) {
    return current.includes(perm) ? current : [...current, perm]
  }
  return current.filter((p) => p !== perm)
}

function toggleGroup(
  current: Permission[],
  groupPerms: Permission[],
  checked: boolean,
): Permission[] {
  if (checked) {
    const next = new Set(current)
    for (const p of groupPerms) next.add(p)
    return [...next]
  }
  const remove = new Set(groupPerms)
  return current.filter((p) => !remove.has(p))
}

function groupCheckState(
  value: Permission[],
  groupPerms: Permission[],
): boolean | "indeterminate" {
  const selected = groupPerms.filter((p) => value.includes(p)).length
  if (selected === 0) return false
  if (selected === groupPerms.length) return true
  return "indeterminate"
}

function PermissionRow({
  option,
  checked,
  disabled,
  onCheckedChange,
}: {
  option: PermissionOption
  checked: boolean
  disabled?: boolean
  onCheckedChange: (checked: boolean) => void
}) {
  return (
    <label
      className={cn(
        "flex items-start gap-3 rounded-md border p-3 cursor-pointer hover:bg-muted/40",
        disabled && "opacity-60 cursor-not-allowed",
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        className="mt-0.5"
      />
      <div className="space-y-0.5 min-w-0">
        <div className="text-sm font-medium leading-none">{option.label}</div>
        <div className="text-xs text-muted-foreground font-mono">{option.value}</div>
        {option.description ? (
          <p className="text-xs text-muted-foreground pt-0.5">{option.description}</p>
        ) : null}
      </div>
    </label>
  )
}

export function AdminPermissionPicker({
  value,
  onChange,
  disabled = false,
  className,
}: AdminPermissionPickerProps) {
  return (
    <div className={cn("space-y-5", className)}>
      {ADMIN_PERMISSION_GROUPS.map((group) => {
        const groupPerms = permissionsForGroup(group.id)
        const groupState = groupCheckState(value, groupPerms)

        return (
          <div key={group.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-3 pb-1">
              <Checkbox
                id={`perm-group-${group.id}`}
                checked={groupState === "indeterminate" ? "indeterminate" : groupState}
                disabled={disabled}
                onCheckedChange={(v) =>
                  onChange(toggleGroup(value, groupPerms, v === true))
                }
              />
              <Label
                htmlFor={`perm-group-${group.id}`}
                className="text-sm font-semibold cursor-pointer"
              >
                {group.label}
                <span className="ml-2 font-normal text-muted-foreground">
                  ({groupPerms.filter((p) => value.includes(p)).length}/{groupPerms.length})
                </span>
              </Label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {group.permissions.map((option) => (
                <PermissionRow
                  key={option.value}
                  option={option}
                  checked={value.includes(option.value)}
                  disabled={disabled}
                  onCheckedChange={(checked) =>
                    onChange(togglePermission(value, option.value, checked))
                  }
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
