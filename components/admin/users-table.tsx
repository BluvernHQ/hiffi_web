"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, ChevronLeft, ChevronRight, Trash2, Filter } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { ProfilePicture } from "@/components/profile/profile-picture"
import { format } from "date-fns"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { FilterSidebar, FilterSection, FilterField } from "./filter-sidebar"
import { SortableHeader, SortDirection } from "./sortable-header"

export function AdminUsersTable() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [showFilters, setShowFilters] = useState(true)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const { toast } = useToast()
  const limit = 20

  // Filter state
  const [filters, setFilters] = useState({
    username: "",
    name: "",
    role: "",
    followers_min: "",
    followers_max: "",
    following_min: "",
    following_max: "",
    total_videos_min: "",
    total_videos_max: "",
    created_after: "",
    created_before: "",
    updated_after: "",
    updated_before: "",
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      // Calculate offset: page 1 = offset 0, page 2 = offset 20, etc.
      const offset = Math.max(0, (page - 1) * limit)
      
      // Build filter params - always include limit and offset for pagination
      const params: any = { limit, offset }
      
      console.log("[admin] Fetching users:", { page, limit, offset })
      if (filters.username) params.username = filters.username
      if (filters.name) params.name = filters.name
      if (filters.role) params.role = filters.role
      if (filters.followers_min) params.followers_min = parseInt(filters.followers_min)
      if (filters.followers_max) params.followers_max = parseInt(filters.followers_max)
      if (filters.following_min) params.following_min = parseInt(filters.following_min)
      if (filters.following_max) params.following_max = parseInt(filters.following_max)
      if (filters.total_videos_min) params.total_videos_min = parseInt(filters.total_videos_min)
      if (filters.total_videos_max) params.total_videos_max = parseInt(filters.total_videos_max)
      if (filters.created_after) params.created_after = filters.created_after
      if (filters.created_before) params.created_before = filters.created_before
      if (filters.updated_after) params.updated_after = filters.updated_after
      if (filters.updated_before) params.updated_before = filters.updated_before

      const response = await apiClient.adminListUsers(params)
      let usersData = response.users || []
      
      // Client-side sorting
      if (sortKey && sortDirection) {
        usersData = [...usersData].sort((a, b) => {
          let aValue: any = a[sortKey]
          let bValue: any = b[sortKey]
          
          // Handle nested properties
          if (sortKey === "username") aValue = a.username || ""
          if (sortKey === "email") aValue = a.email || ""
          if (sortKey === "role") aValue = a.role || ""
          if (sortKey === "followers") aValue = a.followers || 0
          if (sortKey === "following") aValue = a.following || 0
          if (sortKey === "total_videos") aValue = a.total_videos || 0
          if (sortKey === "created_at") aValue = a.created_at ? new Date(a.created_at).getTime() : 0
          
          if (sortKey === "username") bValue = b.username || ""
          if (sortKey === "email") bValue = b.email || ""
          if (sortKey === "role") bValue = b.role || ""
          if (sortKey === "followers") bValue = b.followers || 0
          if (sortKey === "following") bValue = b.following || 0
          if (sortKey === "total_videos") bValue = b.total_videos || 0
          if (sortKey === "created_at") bValue = b.created_at ? new Date(b.created_at).getTime() : 0
          
          // Handle string comparison
          if (typeof aValue === "string" && typeof bValue === "string") {
            const comparison = aValue.localeCompare(bValue)
            return sortDirection === "asc" ? comparison : -comparison
          }
          
          // Handle number comparison
          const comparison = (aValue || 0) - (bValue || 0)
          return sortDirection === "asc" ? comparison : -comparison
        })
      }
      
      setUsers(usersData)
      
      // Handle total count - API might return count as page size, not total
      let totalCount = response.count || 0
      
      // Smart total count detection:
      // 1. If we got a full page (limit items), there might be more pages
      // 2. If we got fewer than limit, this is the last page
      // 3. If API count is much larger than current page, trust it
      if (usersData.length === limit) {
        // Full page - check if API count is reliable
        if (totalCount === limit || totalCount === 0 || totalCount === usersData.length) {
          // API likely returned page count, not total - estimate at least one more page exists
          totalCount = (page * limit) + 1
        } else if (totalCount > (page * limit)) {
          // API returned a total larger than current page - trust it
          // totalCount stays as-is
        }
      } else if (usersData.length < limit) {
        // Partial page - this is definitely the last page
        totalCount = (page - 1) * limit + usersData.length
      }
      
      setTotal(totalCount)
      console.log("[admin] Users fetched:", {
        count: usersData.length,
        total: totalCount,
        page,
        limit,
        offset,
        totalPages: Math.ceil(totalCount / limit),
        responseCount: response.count,
        response: response
      })
    } catch (error) {
      console.error("[admin] Failed to fetch users:", error)
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page, filters, sortKey, sortDirection])

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : null)
    setSortDirection(direction)
    setPage(1)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1)
  }

  const clearFilters = () => {
    setFilters({
      username: "",
      name: "",
      role: "",
      followers_min: "",
      followers_max: "",
      following_min: "",
      following_max: "",
      total_videos_min: "",
      total_videos_max: "",
      created_after: "",
      created_before: "",
      updated_after: "",
      updated_before: "",
    })
    setPage(1)
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== "")
  const totalPages = Math.ceil(total / limit)

  const handleDeleteClick = (user: any) => {
    setUserToDelete(user)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!userToDelete?.uid) return

    try {
      setDeletingUserId(userToDelete.uid)
      await apiClient.deleteUserByUid(userToDelete.uid)
      
      toast({
        title: "Success",
        description: "User deleted successfully",
      })
      
      await fetchUsers()
    } catch (error: any) {
      console.error("[admin] Failed to delete user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      })
    } finally {
      setDeletingUserId(null)
      setDeleteDialogOpen(false)
      setUserToDelete(null)
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex gap-6 min-h-0 overflow-hidden">
      {/* Filter Sidebar */}
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onClear={clearFilters}
        activeFilterCount={Object.values(filters).filter((v) => v !== "").length}
      >
        <FilterSection title="Search">
          <FilterField label="Username" htmlFor="username">
            <Input
              id="username"
              placeholder="Filter by username..."
              value={filters.username}
              onChange={(e) => handleFilterChange("username", e.target.value)}
            />
          </FilterField>
          <FilterField label="Name" htmlFor="name">
            <Input
              id="name"
              placeholder="Filter by name..."
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
            />
          </FilterField>
          <FilterField label="Role" htmlFor="role">
            <select
              id="role"
              value={filters.role}
              onChange={(e) => handleFilterChange("role", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">All roles</option>
              <option value="user">User</option>
              <option value="creator">Creator</option>
              <option value="admin">Admin</option>
            </select>
          </FilterField>
        </FilterSection>

        <FilterSection title="Followers">
          <FilterField label="Min Followers" htmlFor="followers_min">
            <Input
              id="followers_min"
              type="number"
              placeholder="Min followers..."
              value={filters.followers_min}
              onChange={(e) => handleFilterChange("followers_min", e.target.value)}
            />
          </FilterField>
          <FilterField label="Max Followers" htmlFor="followers_max">
            <Input
              id="followers_max"
              type="number"
              placeholder="Max followers..."
              value={filters.followers_max}
              onChange={(e) => handleFilterChange("followers_max", e.target.value)}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Following">
          <FilterField label="Min Following" htmlFor="following_min">
            <Input
              id="following_min"
              type="number"
              placeholder="Min following..."
              value={filters.following_min}
              onChange={(e) => handleFilterChange("following_min", e.target.value)}
            />
          </FilterField>
          <FilterField label="Max Following" htmlFor="following_max">
            <Input
              id="following_max"
              type="number"
              placeholder="Max following..."
              value={filters.following_max}
              onChange={(e) => handleFilterChange("following_max", e.target.value)}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Videos">
          <FilterField label="Min Videos" htmlFor="total_videos_min">
            <Input
              id="total_videos_min"
              type="number"
              placeholder="Min videos..."
              value={filters.total_videos_min}
              onChange={(e) => handleFilterChange("total_videos_min", e.target.value)}
            />
          </FilterField>
          <FilterField label="Max Videos" htmlFor="total_videos_max">
            <Input
              id="total_videos_max"
              type="number"
              placeholder="Max videos..."
              value={filters.total_videos_max}
              onChange={(e) => handleFilterChange("total_videos_max", e.target.value)}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Date Created">
          <FilterField label="Created After" htmlFor="created_after">
            <Input
              id="created_after"
              type="datetime-local"
              value={filters.created_after ? new Date(filters.created_after).toISOString().slice(0, 16) : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : ""
                handleFilterChange("created_after", date)
              }}
            />
          </FilterField>
          <FilterField label="Created Before" htmlFor="created_before">
            <Input
              id="created_before"
              type="datetime-local"
              value={filters.created_before ? new Date(filters.created_before).toISOString().slice(0, 16) : ""}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : ""
                handleFilterChange("created_before", date)
              }}
            />
          </FilterField>
        </FilterSection>
      </FilterSidebar>

      {/* Main Content */}
      <div className="flex-1 space-y-4 min-w-0 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 shrink-0">
          <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
              placeholder="Quick search by username..."
              value={filters.username}
              onChange={(e) => handleFilterChange("username", e.target.value)}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-1 rounded-full bg-primary/20 px-2 py-0.5 text-xs">
                {Object.values(filters).filter((v) => v !== "").length}
              </span>
            )}
          </Button>
      </div>

        {/* Table */}
        <div className="rounded-lg border bg-background shadow-sm flex-1 min-h-0 flex flex-col">
          <div className="overflow-auto flex-1">
          <table className="w-full">
              <thead className="sticky top-0 bg-muted/50 z-10">
                <tr className="border-b">
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">User</th>
                  <SortableHeader
                    label="Username"
                    sortKey="username"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Email"
                    sortKey="email"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Role"
                    sortKey="role"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Followers"
                    sortKey="followers"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Following"
                    sortKey="following"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Videos"
                    sortKey="total_videos"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <SortableHeader
                    label="Joined"
                    sortKey="created_at"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                  />
                  <th className="h-12 px-4 text-left align-middle font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
                {users.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-base font-medium">No users found</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {hasActiveFilters ? "Try adjusting your filters" : "No users in the system"}
                        </p>
                    </div>
                  </td>
                </tr>
              ) : (
                  users.map((user) => (
                  <tr 
                    key={user.uid || user.username} 
                      className="border-b hover:bg-muted/50 transition-colors"
                  >
                      <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <ProfilePicture user={user} size="md" />
                        <div className="font-medium">{user.name || "N/A"}</div>
                      </div>
                    </td>
                      <td className="px-4 py-3">
                      <Link
                        href={`/profile/${user.username}`}
                          className="text-primary hover:underline font-medium"
                      >
                        @{user.username}
                      </Link>
                    </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.email || "N/A"}
                    </td>
                      <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                            : user.role === "creator"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {user.role || "user"}
                      </span>
                    </td>
                      <td className="px-4 py-3 font-medium">{user.followers || 0}</td>
                      <td className="px-4 py-3 font-medium">{user.following || 0}</td>
                      <td className="px-4 py-3 font-medium">{user.total_videos || 0}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                      {user.created_at
                        ? format(new Date(user.created_at), "MMM d, yyyy")
                        : "N/A"}
                    </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                        <Link href={`/profile/${user.username}`}>View</Link>
                      </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(user)}
                            disabled={deletingUserId === user.uid}
                            className="hover:bg-destructive/10 text-destructive hover:text-destructive"
                          >
                            {deletingUserId === user.uid ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t shrink-0">
          <div className="text-sm text-muted-foreground">
            {total > 0 ? (
              <>
                Showing <span className="font-medium text-foreground">{((page - 1) * limit) + 1}</span> to{" "}
                <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{" "}
                <span className="font-medium text-foreground">{total}</span> users
                {totalPages > 1 && (
                  <span className="ml-2">(Page {page} of {totalPages})</span>
                )}
              </>
            ) : (
              <span>No users found</span>
            )}
          </div>
          {totalPages > 1 ? (
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
              
              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {(() => {
                  const pages: (number | string)[] = []
                  const maxVisible = 7
                  
                  if (totalPages <= maxVisible) {
                    // Show all pages if 7 or fewer
                    for (let i = 1; i <= totalPages; i++) {
                      pages.push(i)
                    }
                  } else {
                    // Show first page
                    pages.push(1)
                    
                    if (page > 3) {
                      pages.push("...")
                    }
                    
                    // Show pages around current page
                    const start = Math.max(2, page - 1)
                    const end = Math.min(totalPages - 1, page + 1)
                    
                    for (let i = start; i <= end; i++) {
                      pages.push(i)
                    }
                    
                    if (page < totalPages - 2) {
                      pages.push("...")
                    }
                    
                    // Show last page
                    pages.push(totalPages)
                  }
                  
                  return pages.map((p, idx) => {
                    if (p === "...") {
                      return (
                        <span key={`ellipsis-${idx}`} className="px-2 text-muted-foreground">
                          ...
                        </span>
                      )
                    }
                    
                    const pageNum = p as number
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="min-w-[2.5rem]"
                      >
                        {pageNum}
                      </Button>
                    )
                  })
                })()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              {total > 0 && total <= limit ? "All users displayed" : ""}
            </div>
          )}
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete user <strong>@{userToDelete?.username}</strong>? This action cannot be undone and will delete all associated data including videos, comments, and followers.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingUserId !== null}
            >
              {deletingUserId ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
