"use client"

import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { getProfilePictureUrl, getColorFromName, getAvatarLetter } from "@/lib/utils"
import { format } from "date-fns"
import Link from "next/link"

export function AdminUsersTable() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")
  const limit = 20

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await apiClient.getAllUsers(page, limit)
      setUsers(response.users || [])
      setTotal(response.total || 0)
    } catch (error) {
      console.error("[admin] Failed to fetch users:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [page])

  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.username?.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    )
  })

  const totalPages = Math.ceil(total / limit)

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 border-2 focus:border-primary/50 transition-colors"
          />
        </div>
      </div>

      <div className="rounded-lg border-2 overflow-hidden bg-background">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 bg-muted/30">
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">User</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Username</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Email</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Role</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Followers</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Following</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Videos</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Joined</th>
                <th className="h-12 px-5 text-left align-middle font-semibold text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="h-32 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center py-8">
                      <p className="text-base font-medium">No users found</p>
                      <p className="text-sm text-muted-foreground mt-1">Try adjusting your search query</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr 
                    key={user.uid || user.username} 
                    className="border-b hover:bg-muted/30 transition-colors duration-150"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={getProfilePictureUrl(user)} />
                          <AvatarFallback
                            className="text-white font-semibold"
                            style={{ backgroundColor: getColorFromName(user.name || user.username || "U") }}
                          >
                            {getAvatarLetter(user, "U")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name || "N/A"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/profile/${user.username}`}
                        className="text-primary hover:text-primary/80 hover:underline font-medium transition-colors"
                      >
                        @{user.username}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {user.email || "N/A"}
                    </td>
                    <td className="px-5 py-4">
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
                    <td className="px-5 py-4 font-medium">{user.followers || 0}</td>
                    <td className="px-5 py-4 font-medium">{user.following || 0}</td>
                    <td className="px-5 py-4 font-medium">{user.total_videos || 0}</td>
                    <td className="px-5 py-4 text-sm text-muted-foreground">
                      {user.created_at
                        ? format(new Date(user.created_at), "MMM d, yyyy")
                        : "N/A"}
                    </td>
                    <td className="px-5 py-4">
                      <Button variant="ghost" size="sm" asChild className="hover:bg-primary/10">
                        <Link href={`/profile/${user.username}`}>View</Link>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{((page - 1) * limit) + 1}</span> to{" "}
            <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{" "}
            <span className="font-medium text-foreground">{total}</span> users
          </div>
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
        </div>
      )}
    </div>
  )
}

