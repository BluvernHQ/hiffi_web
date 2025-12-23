"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Upload, Menu, UserIcon, LogOut, Sparkles, Video, Loader2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SearchOverlay } from "@/components/search/search-overlay"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useState, useEffect } from "react"
import { getColorFromName, getAvatarLetter, getProfilePictureUrl, fetchProfilePictureWithAuth } from "@/lib/utils"
import { Logo } from "./logo"


interface NavbarProps {
  onMenuClick?: () => void
  currentFilter?: 'all' | 'following'
}

export function Navbar({ onMenuClick, currentFilter }: NavbarProps) {
  const { user, userData, logout } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [profilePictureUrl, setProfilePictureUrl] = useState<string | undefined>(undefined)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  
  // Hide upload button on following page
  const showUploadButton = pathname !== '/following'
  
  // Function to fetch and update profile picture
  const fetchAndUpdateProfilePicture = () => {
    // Store previous blob URL for cleanup
    const previousBlobUrl = profilePictureUrl
    
    if (!userData) {
      // Cleanup previous blob URL
      if (previousBlobUrl && previousBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previousBlobUrl)
      }
      setProfilePictureUrl(undefined)
      return
    }
    
    const profilePicUrl = getProfilePictureUrl(userData, true)
    if (!profilePicUrl) {
      // Cleanup previous blob URL
      if (previousBlobUrl && previousBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previousBlobUrl)
      }
      setProfilePictureUrl(undefined)
      return
    }
    
    console.log("[navbar] Fetching profile picture (userData changed):", {
      profile_picture: userData.profile_picture,
      image: userData.image,
      updated_at: userData.updated_at,
      url: profilePicUrl
    })
    
    // If it's a Workers URL, fetch with auth and create blob URL (always fresh)
    if (profilePicUrl.includes('black-paper-83cf.hiffi.workers.dev')) {
      // Always fetch fresh - add timestamp to force new fetch
      const freshUrl = profilePicUrl.includes('?') 
        ? `${profilePicUrl}&_nav=${Date.now()}`
        : `${profilePicUrl}?_nav=${Date.now()}`
      
      fetchProfilePictureWithAuth(freshUrl)
        .then(blobUrl => {
          // Clean up previous blob URL before setting new one
          if (previousBlobUrl && previousBlobUrl !== blobUrl && previousBlobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previousBlobUrl)
          }
          setProfilePictureUrl(blobUrl)
          console.log("[navbar] Profile picture updated (fresh fetch):", blobUrl)
        })
        .catch(error => {
          console.error("[navbar] Failed to fetch profile picture with auth:", error)
          // Clean up previous blob URL on error
          if (previousBlobUrl && previousBlobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previousBlobUrl)
          }
          // Fallback to direct URL
          setProfilePictureUrl(profilePicUrl)
        })
    } else {
      // Not a Workers URL, clean up previous blob URL and use directly
      if (previousBlobUrl && previousBlobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previousBlobUrl)
      }
      setProfilePictureUrl(profilePicUrl)
    }
  }

  // Fetch profile picture with authentication when userData changes
  // Always fetch fresh - no caching
  // This effect runs whenever userData changes, including when profile picture is updated
  useEffect(() => {
    fetchAndUpdateProfilePicture()
    
    // Cleanup blob URL on unmount
    return () => {
      if (profilePictureUrl && profilePictureUrl.startsWith('blob:')) {
        URL.revokeObjectURL(profilePictureUrl)
      }
    }
  }, [userData]) // Depend on entire userData object to catch any changes

  // Listen for custom event when profile picture is updated
  useEffect(() => {
    const handleProfilePictureUpdate = (event: CustomEvent) => {
      console.log("[navbar] Received profilePictureUpdated event:", event.detail)
      // Force immediate refresh of profile picture
      fetchAndUpdateProfilePicture()
    }

    window.addEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener)
    
    return () => {
      window.removeEventListener('profilePictureUpdated', handleProfilePictureUpdate as EventListener)
    }
  }, [userData]) // Re-bind listener when userData changes

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true)
  }

  const handleLogoutConfirm = async () => {
    try {
      setIsLoggingOut(true)
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
      setIsLoggingOut(false)
      setLogoutDialogOpen(false)
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-4 md:gap-6 px-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} showText={false} />
              <span className="hidden font-bold text-xl md:inline-block">Hiffi</span>
            </Link>
          </div>

          <div className="flex flex-1 items-center justify-center px-4 md:px-8">
            <div className="relative w-full max-w-md">
              <button onClick={() => setIsSearchOpen(true)} className="w-full text-left">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  type="search"
                  placeholder="Search videos..."
                  className="w-full rounded-full bg-muted pl-9 md:w-[300px] lg:w-[400px] cursor-pointer"
                  readOnly
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 pr-4">
            {user && userData ? (
              <>
                {showUploadButton && (
                  <>
                    {userData.role === "creator" ? (
                      <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                        <Link href="/creator/apply">
                          <Upload className="h-5 w-5" />
                          <span className="sr-only">Hiffi Studio</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                        <Link href="/creator/apply">
                          <Sparkles className="h-5 w-5" />
                          <span className="sr-only">Become Creator</span>
                        </Link>
                      </Button>
                    )}
                  </>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={profilePictureUrl}
                          key={`navbar-avatar-${userData?.profile_picture || userData?.image || 'none'}-${userData?.updated_at || Date.now()}-${Date.now()}`}
                          alt={userData.name || userData.username || "User"}
                        />
                        <AvatarFallback 
                          className="text-white font-semibold"
                          style={{ backgroundColor: getColorFromName((userData.name || userData.username || "U")) }}
                        >
                          {getAvatarLetter(userData, "U")}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userData.name || userData.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">@{userData.username}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${userData.username}`}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {userData.role === "creator" ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/creator/apply">
                            <Video className="mr-2 h-4 w-4" />
                            <span>Hiffi Studio</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/creator/apply">
                          <Sparkles className="mr-2 h-4 w-4" />
                          <span>Become a Creator</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogoutClick} className="text-destructive focus:text-destructive">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link href="/login">Log in</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to log in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              disabled={isLoggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                "Logout"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
