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
import { ProfilePicture } from "@/components/profile/profile-picture"
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
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  
  // Hide upload button on following page
  const showUploadButton = pathname !== '/following'
  
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
          <div className="flex items-center gap-2 sm:gap-4 px-4 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-9 w-9" 
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

          <div className="flex-1 flex items-center justify-center px-2 min-w-0">
            <div className="relative w-full max-w-[240px] md:max-w-md transition-all duration-300">
              <div 
                onClick={() => setIsSearchOpen(true)} 
                className="group relative flex items-center w-full h-9 rounded-full bg-muted/50 border border-input hover:bg-muted hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
              >
                <Search className="absolute left-3 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="pl-10 text-sm text-muted-foreground truncate pr-4">
                  Search...
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 pr-4 flex-shrink-0">
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
                      <ProfilePicture user={userData} size="sm" />
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
                <Button asChild className="rounded-full px-6">
                  <Link href="/login">Log in</Link>
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
