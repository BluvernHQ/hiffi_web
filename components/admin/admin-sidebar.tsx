"use client"

import React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Users,
  Video,
  MessageSquare,
  Reply,
  UsersRound,
  Megaphone,
  Handshake,
  Flag,
  Shield,
  ShieldCheck,
  X,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Search as SearchIcon,
  ArrowDownToLine,
  ListMusic,
  Mic2,
  Route,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAdminPermissions } from "@/hooks/use-admin-permissions"
import type { AdminPermission } from "@/lib/auth/admin-permissions"
import { AdminViewSiteLink } from "@/components/admin/admin-view-site-link"

interface AdminSidebarProps {
  className?: string
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

type NavItem = {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  permission: AdminPermission
}

type NavSection = {
  title: string
  items: NavItem[]
}

const navSections: NavSection[] = [
  {
    title: "Overview",
    items: [
      { icon: BarChart3, label: "Dashboard", value: "overview", permission: "admin:overview" },
    ],
  },
  {
    title: "Artist Index",
    items: [
      { icon: Mic2, label: "Artist Inventory", value: "artist_inventory", permission: "admin:inventory" },
    ],
  },
  {
    title: "Editorial",
    items: [
      { icon: ListMusic, label: "Curated Playlists", value: "curated_playlists", permission: "admin:curated" },
    ],
  },
  {
    title: "Moderation",
    items: [
      { icon: Video, label: "Videos", value: "videos", permission: "admin:videos" },
      { icon: MessageSquare, label: "Comments", value: "comments", permission: "admin:comments" },
      { icon: Reply, label: "Replies", value: "replies", permission: "admin:replies" },
      { icon: Flag, label: "Reports", value: "flags", permission: "admin:flags" },
    ],
  },
  {
    title: "Community",
    items: [
      { icon: Users, label: "Users", value: "users", permission: "admin:users" },
      { icon: UserPlus, label: "Followers", value: "followers", permission: "admin:followers" },
      { icon: UsersRound, label: "Referrals", value: "referrals", permission: "admin:referrals" },
    ],
  },
  {
    title: "Insights",
    items: [
      { icon: Route, label: "Journeys", value: "journeys", permission: "admin:journeys" },
      { icon: SearchIcon, label: "Searches", value: "searches", permission: "admin:searches" },
      { icon: Megaphone, label: "UTM Campaigns", value: "utm_polls", permission: "admin:utm" },
      { icon: Handshake, label: "Collaboration", value: "collaboration", permission: "admin:collaboration" },
    ],
  },
  {
    title: "Operations",
    items: [
      { icon: ArrowDownToLine, label: "Migration Requests", value: "migrations", permission: "admin:migrations" },
    ],
  },
  {
    title: "Administration",
    items: [
      { icon: ShieldCheck, label: "Admins", value: "admins", permission: "admin:admins" },
    ],
  },
]

function adminInitials(username: string, email: string): string {
  const source = username.trim() || email.trim()
  if (!source) return "A"
  const parts = source.split(/[\s@._-]+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function AdminSidebar({
  className,
  isMobileOpen = false,
  onMobileClose,
  isCollapsed = false,
  onToggleCollapse,
}: AdminSidebarProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { can, admin, role } = useAdminPermissions()

  const visibleSections = navSections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => can(item.permission)),
    }))
    .filter((section) => section.items.length > 0)

  const section = searchParams.get("flagId")
    ? "flags"
    : searchParams.get("playlistId")
      ? "curated_playlists"
      : searchParams.get("sessionId")
        ? "journeys"
        : searchParams.get("section") || "overview"

  const handleSectionChange = (value: string) => {
    router.push(`/admin/dashboard?section=${value}`)
    onMobileClose?.()
  }

  return (
    <>
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          "flex-shrink-0 border-r bg-background transition-all duration-300 ease-in-out",
          "fixed left-0 top-0 z-40 h-screen shadow-xl",
          "lg:sticky lg:left-auto lg:top-16 lg:z-auto lg:h-[calc(100vh-4rem)] lg:shadow-none",
          isCollapsed ? "w-16 lg:w-16" : "w-[280px] sm:w-64 lg:w-64",
          !isMobileOpen && "-translate-x-full lg:translate-x-0",
          className,
        )}
        aria-label="Admin navigation sidebar"
      >
        <div className="flex flex-col h-full">
          <div className="flex h-16 items-center justify-between border-b px-4 lg:hidden shrink-0">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Shield className="h-4 w-4 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-semibold">Admin</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={onMobileClose} className="h-8 w-8">
              <X className="h-5 w-5" />
            </Button>
          </div>

          {onToggleCollapse && (
            <div className="hidden lg:flex items-center justify-end border-b px-2 py-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggleCollapse}
                className="h-8 w-8"
                aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>
          )}

          <nav
            className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4 lg:pt-4"
            style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(0, 0, 0, 0.2) transparent" }}
            aria-label="Admin navigation"
          >
            <div className="mb-4 border-b border-border/60 pb-4">
              <AdminViewSiteLink isCollapsed={isCollapsed} />
            </div>

            <div className="space-y-5 min-h-0">
              {visibleSections.map((navSection, sectionIndex) => (
                <div key={navSection.title}>
                  {!isCollapsed ? (
                    <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {navSection.title}
                    </p>
                  ) : sectionIndex > 0 ? (
                    <div className="mb-2 border-t border-border/60" aria-hidden />
                  ) : null}
                  <ul className="space-y-0.5">
                    {navSection.items.map((item) => {
                      const Icon = item.icon
                      const isActive = section === item.value
                      return (
                        <li key={item.value}>
                          <button
                            type="button"
                            onClick={() => handleSectionChange(item.value)}
                            aria-current={isActive ? "page" : undefined}
                            title={isCollapsed ? item.label : undefined}
                            className={cn(
                              "w-full flex items-center rounded-lg text-sm transition-colors text-left",
                              "hover:bg-muted/80 active:scale-[0.99]",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                              isCollapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5",
                              isActive
                                ? "bg-primary/10 text-foreground font-medium"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            <Icon
                              className={cn(
                                "h-[18px] w-[18px] flex-shrink-0",
                                isActive ? "text-primary" : "text-muted-foreground",
                              )}
                              aria-hidden="true"
                            />
                            {!isCollapsed && <span className="truncate">{item.label}</span>}
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </nav>

          {admin && !isCollapsed ? (
            <div className="shrink-0 border-t p-3">
              <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                  {adminInitials(admin.username, admin.email)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium leading-tight">{admin.username}</p>
                  <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                </div>
              </div>
              {role ? (
                <Badge variant="secondary" className="mt-2 w-full justify-center capitalize text-[11px]">
                  {role.replace("_", " ")}
                </Badge>
              ) : null}
            </div>
          ) : null}

          {admin && isCollapsed ? (
            <div className="shrink-0 border-t p-2 flex justify-center">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
                title={admin.email}
              >
                {adminInitials(admin.username, admin.email)}
              </div>
            </div>
          ) : null}
        </div>
      </aside>
    </>
  )
}
