"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Search, ChevronLeft, ChevronRight, Trash2, Ban, CheckCircle } from "lucide-react"
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
  const [isFilterCollapsed, setIsFilterCollapsed] = useState(true)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<any>(null)
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const { toast } = useToast()
  const limit = 20

  // Load collapsed state from localStorage on mount (shared across all admin pages)
  useEffect(() => {
    const savedState = localStorage.getItem("admin-filter-collapsed")
    if (savedState !== null) {
      setIsFilterCollapsed(savedState === "true")
    }
  }, [])

  // Save collapsed state to localStorage (shared across all admin pages)
  const handleToggleCollapse = () => {
    const newState = !isFilterCollapsed
    setIsFilterCollapsed(newState)
    localStorage.setItem("admin-filter-collapsed", String(newState))
  }

  // Search bar state (separate from sidebar filters)
  // searchInput is the immediate input value, searchQuery is debounced for actual searching
  const [searchInput, setSearchInput] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Refs to maintain focus on search inputs
  const desktopSearchInputRef = useRef<HTMLInputElement>(null)
  const mobileSearchInputRef = useRef<HTMLInputElement>(null)
  const wasSearchFocusedRef = useRef(false)
  
  // Refs to maintain focus on filter inputs
  const usernameFilterRef = useRef<HTMLInputElement>(null)
  const nameFilterRef = useRef<HTMLInputElement>(null)
  const wasFilterFocusedRef = useRef<string | null>(null)

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
      
      // Check if search bar is active (has a value)
      const isSearchBarActive = searchQuery.trim() !== ""
      
      let usersData: any[] = []
      let totalCount = 0
      
      if (isSearchBarActive) {
        // When searching, make two API calls - one for username, one for name
        // Fetch all pages for both searches to ensure we get all matching results
        // Then combine and deduplicate results
        const searchTerm = searchQuery.trim()
        
        // Build base params with other filters (excluding name/username)
        const baseParams: any = { limit, offset: 0 }
        
        if (filters.role) baseParams.role = filters.role
        if (filters.followers_min) baseParams.followers_min = parseInt(filters.followers_min)
        if (filters.followers_max) baseParams.followers_max = parseInt(filters.followers_max)
        if (filters.following_min) baseParams.following_min = parseInt(filters.following_min)
        if (filters.following_max) baseParams.following_max = parseInt(filters.following_max)
        if (filters.total_videos_min) baseParams.total_videos_min = parseInt(filters.total_videos_min)
        if (filters.total_videos_max) baseParams.total_videos_max = parseInt(filters.total_videos_max)
        if (filters.created_after) baseParams.created_after = filters.created_after
        if (filters.created_before) baseParams.created_before = filters.created_before
        if (filters.updated_after) baseParams.updated_after = filters.updated_after
        if (filters.updated_before) baseParams.updated_before = filters.updated_before

        // Helper function to fetch all pages for a given filter
        const fetchAllPages = async (params: any): Promise<any[]> => {
          const allUsers: any[] = []
          let currentOffset = 0
          let hasMore = true
          
          while (hasMore) {
            const response = await apiClient.adminListUsers({
              ...params,
              offset: currentOffset,
              limit,
            })
            
            const pageUsers = response.users || []
            allUsers.push(...pageUsers)
            
            // Check if there are more pages
            if (pageUsers.length < limit) {
              hasMore = false
            } else {
              currentOffset += limit
              // Safety limit: don't fetch more than 100 pages (2000 users)
              if (currentOffset >= 100 * limit) {
                hasMore = false
              }
            }
          }
          
          return allUsers
        }

        // Fetch all pages for both username and name searches in parallel
        const [usernameUsers, nameUsers] = await Promise.all([
          fetchAllPages({ ...baseParams, username: searchTerm }),
          fetchAllPages({ ...baseParams, name: searchTerm }),
        ])
        
        // Create a Map to deduplicate by uid (or username if uid is not available)
        const usersMap = new Map<string, any>()
        
        // Add username matches
        usernameUsers.forEach((user: any) => {
          const key = user.uid || user.username
          if (key) {
            usersMap.set(key, user)
          }
        })
        
        // Add name matches (will overwrite if same user, which is fine)
        nameUsers.forEach((user: any) => {
          const key = user.uid || user.username
          if (key) {
            usersMap.set(key, user)
          }
        })
        
        // Convert map back to array
        usersData = Array.from(usersMap.values())
        
        // Additional client-side filtering to ensure exact matches (case-insensitive)
        const searchTermLower = searchTerm.toLowerCase()
        usersData = usersData.filter((user: any) => {
          const usernameMatch = (user.username || "").toLowerCase().includes(searchTermLower)
          const nameMatch = (user.name || "").toLowerCase().includes(searchTermLower)
          return usernameMatch || nameMatch
        })
        
        // Set total count to the filtered results length
        totalCount = usersData.length
        
        // Apply pagination to the filtered results
        const startIndex = offset
        const endIndex = offset + limit
        usersData = usersData.slice(startIndex, endIndex)
      } else {
        // Normal filtering (no search bar active)
        // Build filter params - always include limit and offset for pagination
        const params: any = { limit, offset }
        
        // Individual filters: send both if they have different values
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
        usersData = response.users || []
        
        // Handle total count - API might return count as page size, not total
        totalCount = response.count || 0
        
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
      }
      
      // Client-side sorting
      if (sortKey && sortDirection) {
        usersData = [...usersData].sort((a, b) => {
          let aValue: any = a[sortKey]
          let bValue: any = b[sortKey]
          
          // Handle nested properties
          if (sortKey === "name") aValue = (a.name || "").toLowerCase()
          if (sortKey === "username") aValue = a.username || ""
          if (sortKey === "email") aValue = a.email || ""
          if (sortKey === "role") aValue = a.role || ""
          if (sortKey === "followers") aValue = a.followers || 0
          if (sortKey === "following") aValue = a.following || 0
          if (sortKey === "total_videos") aValue = a.total_videos || 0
          if (sortKey === "created_at") aValue = a.created_at ? new Date(a.created_at).getTime() : 0
          
          if (sortKey === "name") bValue = (b.name || "").toLowerCase()
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
      setTotal(totalCount)
      console.log("[admin] Users fetched:", {
        count: usersData.length,
        total: totalCount,
        page,
        limit,
        offset,
        totalPages: Math.ceil(totalCount / limit),
        isSearchActive: isSearchBarActive,
        searchQuery: isSearchBarActive ? searchQuery : undefined,
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

  // Debounce search input - wait 500ms after user stops typing before searching
  // Clear immediately if input is empty
  useEffect(() => {
    if (searchInput.trim() === "") {
      // Clear search immediately when input is empty
      setSearchQuery("")
      setPage(1)
      return
    }

    const timeoutId = setTimeout(() => {
      setSearchQuery(searchInput)
      setPage(1)
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchInput])

  useEffect(() => {
    fetchUsers()
  }, [page, filters, searchQuery, sortKey, sortDirection])

  // Maintain focus on search input after re-renders
  // This runs whenever users, loading, or searchInput changes to ensure focus is maintained during search
  useEffect(() => {
    if (wasSearchFocusedRef.current) {
      // Use double requestAnimationFrame to ensure DOM is fully updated after state changes
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const activeInput = desktopSearchInputRef.current || mobileSearchInputRef.current
          if (activeInput) {
            // Always restore focus if it was previously focused, even if currently focused
            // This ensures focus is maintained through all re-renders
            if (document.activeElement !== activeInput) {
              activeInput.focus()
            }
            // Restore cursor position at the end
            const cursorPosition = searchInput.length
            activeInput.setSelectionRange(cursorPosition, cursorPosition)
          }
        })
      })
    }
  }, [users, loading, searchInput, searchQuery])

  const handleSort = (key: string, direction: SortDirection) => {
    setSortKey(direction ? key : null)
    setSortDirection(direction)
    setPage(1)
  }

  // Debounce timers for number inputs
  const numberInputTimersRef = useRef<Record<string, NodeJS.Timeout>>({})
  
  // Debounce timers for text filter inputs (username, name)
  const textFilterTimersRef = useRef<Record<string, NodeJS.Timeout>>({})

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(numberInputTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer)
      })
      Object.values(textFilterTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer)
      })
    }
  }, [])

  const handleFilterChange = (key: string, value: string) => {
    // Track which input is focused
    if (key === "username" && usernameFilterRef.current === document.activeElement) {
      wasFilterFocusedRef.current = "username"
    } else if (key === "name" && nameFilterRef.current === document.activeElement) {
      wasFilterFocusedRef.current = "name"
    }
    
    // Update filter value immediately for UI responsiveness
    setFilters((prev) => ({ ...prev, [key]: value }))
    
    // Debounce page reset for text filters to prevent focus loss while typing
    if (key === "username" || key === "name") {
      // Clear existing timer for this field
      if (textFilterTimersRef.current[key]) {
        clearTimeout(textFilterTimersRef.current[key])
      }
      
      // Debounce the page reset - wait 500ms after user stops typing
      textFilterTimersRef.current[key] = setTimeout(() => {
        setPage(1)
        delete textFilterTimersRef.current[key]
      }, 500)
    } else {
      // For other filters, reset page immediately
      setPage(1)
    }
  }
  
  // Maintain focus on filter inputs after re-renders
  useEffect(() => {
    if (wasFilterFocusedRef.current) {
      requestAnimationFrame(() => {
        const activeInput = wasFilterFocusedRef.current === "username" 
          ? usernameFilterRef.current 
          : nameFilterRef.current
        if (activeInput && document.activeElement !== activeInput) {
          activeInput.focus()
          // Restore cursor position at the end
          const cursorPosition = activeInput.value.length
          activeInput.setSelectionRange(cursorPosition, cursorPosition)
        }
      })
    }
  }, [filters.username, filters.name])

  // Handle number input changes with debouncing to prevent page refresh on arrow clicks
  const handleNumberFilterChange = (key: string, value: string) => {
    // Prevent negative values - if value is negative or would become negative, set to empty or 0
    let sanitizedValue = value
    if (value !== "" && value !== "-") {
      const numValue = parseFloat(value)
      if (!isNaN(numValue) && numValue < 0) {
        sanitizedValue = "0"
      }
    }
    
    // Update the filter value immediately for UI responsiveness
    setFilters((prev) => ({ ...prev, [key]: sanitizedValue }))
    
    // Clear existing timer for this field
    if (numberInputTimersRef.current[key]) {
      clearTimeout(numberInputTimersRef.current[key])
    }
    
    // Debounce the page reset - wait 500ms after user stops clicking arrows
    numberInputTimersRef.current[key] = setTimeout(() => {
      setPage(1)
      delete numberInputTimersRef.current[key]
    }, 500)
  }

  // Handle search bar input - updates input immediately, search is debounced
  // Uses separate state so it doesn't interfere with sidebar filters
  const handleSearchChange = (value: string) => {
    setSearchInput(value)
    wasSearchFocusedRef.current = true
    // Don't set page here - it will be set by the debounce effect
  }
  
  // Track when search input loses focus
  const handleSearchBlur = () => {
    // Only clear the flag if focus is moving to another element, not when component re-renders
    setTimeout(() => {
      const activeInput = desktopSearchInputRef.current || mobileSearchInputRef.current
      if (document.activeElement !== activeInput) {
        wasSearchFocusedRef.current = false
      }
    }, 0)
  }
  
  const handleSearchFocus = () => {
    wasSearchFocusedRef.current = true
  }

  const clearFilters = () => {
    setSearchInput("")
    setSearchQuery("")
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

  const hasActiveFilters = searchQuery.trim() !== "" || Object.values(filters).some((v) => v !== "")
  const totalPages = Math.ceil(total / limit)

  // Helper function to convert ISO string to datetime-local format (local time)
  const isoToLocalDateTime = (isoString: string): string => {
    if (!isoString) return ""
    const date = new Date(isoString)
    // Get local date/time components
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    const hours = String(date.getHours()).padStart(2, "0")
    const minutes = String(date.getMinutes()).padStart(2, "0")
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

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

  const handleDisableUser = async (user: any) => {
    if (!user?.username) return

    try {
      setTogglingUserId(user.uid || user.username)
      const response = await apiClient.adminDisableUser(user.username)
      
      toast({
        title: "Success",
        description: response.data?.message || response.message || "User disabled successfully",
      })
      
      await fetchUsers()
    } catch (error: any) {
      console.error("[admin] Failed to disable user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to disable user",
        variant: "destructive",
      })
    } finally {
      setTogglingUserId(null)
    }
  }

  const handleEnableUser = async (user: any) => {
    if (!user?.username) return

    try {
      setTogglingUserId(user.uid || user.username)
      const response = await apiClient.adminEnableUser(user.username)
      
      toast({
        title: "Success",
        description: response.data?.message || response.message || "User enabled successfully",
      })
      
      await fetchUsers()
    } catch (error: any) {
      console.error("[admin] Failed to enable user:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to enable user",
        variant: "destructive",
      })
    } finally {
      setTogglingUserId(null)
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
    <div className="grid grid-cols-[auto_1fr] gap-4 min-h-0 overflow-hidden relative h-full w-full">
      {/* Filter Sidebar - Always visible on desktop, toggleable on mobile */}
      {/* Fixed width column - never shifts regardless of table content */}
      {/* Grid column 1: auto width (based on sidebar width) */}
      <FilterSidebar
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onClear={clearFilters}
        activeFilterCount={Object.values(filters).filter((v) => v !== "").length}
        isCollapsed={isFilterCollapsed}
        onToggleCollapse={handleToggleCollapse}
      >
        <FilterSection title="Search">
          <FilterField label="Username" htmlFor="username">
            <Input
              ref={usernameFilterRef}
              id="username"
              placeholder="Filter by username..."
              value={filters.username}
              onChange={(e) => handleFilterChange("username", e.target.value)}
              onFocus={() => {
                wasFilterFocusedRef.current = "username"
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (document.activeElement !== usernameFilterRef.current && 
                      document.activeElement !== nameFilterRef.current) {
                    wasFilterFocusedRef.current = null
                  }
                }, 0)
              }}
            />
          </FilterField>
          <FilterField label="Name" htmlFor="name">
            <Input
              ref={nameFilterRef}
              id="name"
              placeholder="Filter by name..."
              value={filters.name}
              onChange={(e) => handleFilterChange("name", e.target.value)}
              onFocus={() => {
                wasFilterFocusedRef.current = "name"
              }}
              onBlur={() => {
                setTimeout(() => {
                  if (document.activeElement !== usernameFilterRef.current && 
                      document.activeElement !== nameFilterRef.current) {
                    wasFilterFocusedRef.current = null
                  }
                }, 0)
              }}
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
              min="0"
              placeholder="Min followers..."
              value={filters.followers_min}
              onChange={(e) => handleNumberFilterChange("followers_min", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  setPage(1)
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
          <FilterField label="Max Followers" htmlFor="followers_max">
            <Input
              id="followers_max"
              type="number"
              min="0"
              placeholder="Max followers..."
              value={filters.followers_max}
              onChange={(e) => handleNumberFilterChange("followers_max", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  setPage(1)
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Following">
          <FilterField label="Min Following" htmlFor="following_min">
            <Input
              id="following_min"
              type="number"
              min="0"
              placeholder="Min following..."
              value={filters.following_min}
              onChange={(e) => handleNumberFilterChange("following_min", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  setPage(1)
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
          <FilterField label="Max Following" htmlFor="following_max">
            <Input
              id="following_max"
              type="number"
              min="0"
              placeholder="Max following..."
              value={filters.following_max}
              onChange={(e) => handleNumberFilterChange("following_max", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  setPage(1)
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Videos">
          <FilterField label="Min Videos" htmlFor="total_videos_min">
            <Input
              id="total_videos_min"
              type="number"
              min="0"
              placeholder="Min videos..."
              value={filters.total_videos_min}
              onChange={(e) => handleNumberFilterChange("total_videos_min", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  setPage(1)
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
          <FilterField label="Max Videos" htmlFor="total_videos_max">
            <Input
              id="total_videos_max"
              type="number"
              min="0"
              placeholder="Max videos..."
              value={filters.total_videos_max}
              onChange={(e) => handleNumberFilterChange("total_videos_max", e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  setPage(1)
                }
              }}
              onWheel={(e) => {
                e.currentTarget.blur()
              }}
            />
          </FilterField>
        </FilterSection>

        <FilterSection title="Date Created">
          <FilterField label="Created After" htmlFor="created_after">
            <Input
              id="created_after"
              type="datetime-local"
              value={isoToLocalDateTime(filters.created_after)}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : ""
                handleFilterChange("created_after", date)
              }}
              className={
                filters.created_after && filters.created_before && 
                new Date(filters.created_after) > new Date(filters.created_before)
                  ? "border-destructive"
                  : ""
              }
            />
            {filters.created_after && filters.created_before && 
             new Date(filters.created_after) > new Date(filters.created_before) && (
              <p className="text-xs text-destructive mt-1">
                Created After must be before or equal to Created Before
              </p>
            )}
          </FilterField>
          <FilterField label="Created Before" htmlFor="created_before">
            <Input
              id="created_before"
              type="datetime-local"
              value={isoToLocalDateTime(filters.created_before)}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value).toISOString() : ""
                handleFilterChange("created_before", date)
              }}
              className={
                filters.created_after && filters.created_before && 
                new Date(filters.created_after) > new Date(filters.created_before)
                  ? "border-destructive"
                  : ""
              }
            />
            {filters.created_after && filters.created_before && 
             new Date(filters.created_after) > new Date(filters.created_before) && (
              <p className="text-xs text-destructive mt-1">
                Created Before must be after or equal to Created After
              </p>
            )}
          </FilterField>
        </FilterSection>
      </FilterSidebar>

      {/* Main Content - Flexible column that scrolls independently */}
      {/* Grid column 2: 1fr (takes remaining space) */}
      <div className="min-w-0 overflow-hidden flex flex-col h-full w-full">
        {/* Search Bar - Desktop */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={desktopSearchInputRef}
              placeholder="Search by name or username..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="pl-9"
            />
          </div>
        </div>

        {/* Toolbar - Mobile Only */}
        <div className="flex items-center justify-between gap-4 shrink-0 mb-4 lg:hidden">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={mobileSearchInputRef}
              placeholder="Search by name or username..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-background shadow-sm flex-1 min-h-0 flex flex-col">
          <div className="overflow-auto flex-1">
          <table className="w-full">
              <thead className="sticky top-0 bg-muted/50 z-10">
                <tr className="border-b">
                  <SortableHeader
                    label="User"
                    sortKey="name"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="sticky left-0 z-20 bg-muted/95 backdrop-blur-sm border-r-2 border-primary/20 shadow-[2px_0_4px_rgba(0,0,0,0.1)] min-w-[150px]"
                  />
                  <SortableHeader
                    label="Username"
                    sortKey="username"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[130px]"
                  />
                  <SortableHeader
                    label="Email"
                    sortKey="email"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[170px]"
                  />
                  <SortableHeader
                    label="Role"
                    sortKey="role"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[90px]"
                  />
                  <SortableHeader
                    label="Followers"
                    sortKey="followers"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[95px]"
                  />
                  <SortableHeader
                    label="Following"
                    sortKey="following"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[95px]"
                  />
                  <SortableHeader
                    label="Videos"
                    sortKey="total_videos"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[85px]"
                  />
                  <SortableHeader
                    label="Joined"
                    sortKey="created_at"
                    currentSort={sortKey}
                    currentDirection={sortDirection}
                    onSort={handleSort}
                    className="min-w-[115px]"
                  />
                  <th className="h-12 px-3 text-left align-middle font-semibold text-sm whitespace-nowrap min-w-[130px]">Actions</th>
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
                      className={`border-b hover:bg-muted/50 transition-colors group ${
                        user.disabled ? "opacity-60 bg-muted/30" : ""
                      }`}
                  >
                      <td className={`px-3 py-2 sticky left-0 z-10 border-r-2 border-primary/20 shadow-[2px_0_4px_rgba(0,0,0,0.1)] min-w-[150px] group-hover:bg-muted/50 ${
                        user.disabled ? "bg-muted/30" : "bg-background"
                      }`}>
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <ProfilePicture user={user} size="md" />
                          {user.disabled && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-background rounded-full" title="Disabled" />
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <div className="font-medium truncate text-sm">{user.name || "N/A"}</div>
                          {user.disabled && (
                            <span className="text-xs text-red-600 dark:text-red-400 font-medium">Disabled</span>
                          )}
                        </div>
                      </div>
                    </td>
                      <td className="px-3 py-2 whitespace-nowrap min-w-[130px]">
                      <Link
                        href={`/profile/${user.username}`}
                          className={`font-medium text-sm ${
                            user.disabled 
                              ? "text-muted-foreground line-through opacity-70 hover:no-underline" 
                              : "text-primary hover:underline"
                          }`}
                      >
                        @{user.username}
                      </Link>
                    </td>
                      <td className="px-3 py-2 text-sm text-muted-foreground whitespace-nowrap min-w-[170px]">
                      {user.email || "N/A"}
                    </td>
                      <td className="px-3 py-2 whitespace-nowrap min-w-[90px]">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            user.role === "admin"
                              ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                              : user.role === "creator"
                              ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {user.role || "user"}
                        </span>
                        {user.disabled && (
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border border-red-300 dark:border-red-700">
                            Disabled
                          </span>
                        )}
                      </div>
                    </td>
                      <td className="px-3 py-2 font-medium text-sm whitespace-nowrap min-w-[95px]">{user.followers || 0}</td>
                      <td className="px-3 py-2 font-medium text-sm whitespace-nowrap min-w-[95px]">{user.following || 0}</td>
                      <td className="px-3 py-2 font-medium text-sm whitespace-nowrap min-w-[85px]">{user.total_videos || 0}</td>
                      <td className="px-3 py-2 text-sm text-muted-foreground whitespace-nowrap min-w-[115px]">
                      {user.created_at
                        ? format(new Date(user.created_at), "MMM d, yyyy")
                        : "N/A"}
                    </td>
                      <td className="px-3 py-2 whitespace-nowrap min-w-[130px]">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" asChild>
                        <Link href={`/profile/${user.username}`}>View</Link>
                      </Button>
                          {user.disabled ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEnableUser(user)}
                              disabled={togglingUserId === (user.uid || user.username)}
                              className="hover:bg-green-500/10 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                              title="Enable user"
                            >
                              {togglingUserId === (user.uid || user.username) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDisableUser(user)}
                              disabled={togglingUserId === (user.uid || user.username)}
                              className="hover:bg-orange-500/10 text-orange-600 hover:text-orange-700 dark:text-orange-400 dark:hover:text-orange-300"
                              title="Disable user"
                            >
                              {togglingUserId === (user.uid || user.username) ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Ban className="h-4 w-4" />
                              )}
                            </Button>
                          )}
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
