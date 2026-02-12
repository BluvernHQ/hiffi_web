"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useAuth } from "@/lib/auth-context"
import { buildLoginUrl } from "@/lib/auth-utils"
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
import { getColorFromName, getAvatarLetter, getProfilePictureUrl } from "@/lib/utils"


interface NavbarProps {
  onMenuClick?: () => void
  currentFilter?: 'all' | 'following'
}

// Internal component that uses useSearchParams - wrapped in Suspense
function NavbarContent({ onMenuClick, currentFilter }: NavbarProps) {
  const { user, userData, logout } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined
  
  // Hide upload button on following page
  const showUploadButton = pathname !== '/following'
  
  const handleLogoutClick = () => {
    setLogoutDialogOpen(true)
  }

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true)
    // Close dialog immediately before logout to prevent overlay from blocking interactions
    setLogoutDialogOpen(false)
    try {
      // Force cleanup of dialog overlay elements
      if (typeof window !== "undefined") {
        // Wait for React to process state update
        await new Promise(resolve => requestAnimationFrame(resolve))
        
        // Aggressively remove all dialog-related elements
        const cleanup = () => {
          // Remove overlay elements
          const overlayElements = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-focus-guard]')
          overlayElements.forEach(el => {
            try {
              el.remove()
            } catch (e) {
              // Ignore errors
            }
          })
          
          // Reset body styles
          document.body.style.pointerEvents = ""
          document.body.style.overflow = ""
        }
        
        // Cleanup immediately
        cleanup()
        
        // Cleanup again after a short delay to catch any elements that were added during animation
        await new Promise(resolve => setTimeout(resolve, 150))
        cleanup()
      }
      
      await logout()
      // logout() will redirect, so we don't need to reset state here
    } catch (error) {
      console.error("Logout failed:", error)
      // Reset state if logout fails so user can try again
      setIsLoggingOut(false)
      setLogoutDialogOpen(false)
      
      // Cleanup on error as well
      if (typeof window !== "undefined") {
        const overlayElements = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-focus-guard]')
        overlayElements.forEach(el => el.remove())
        document.body.style.pointerEvents = ""
        document.body.style.overflow = ""
      }
    }
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-3 md:px-4 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden h-9 w-9" 
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <Link href="/home" className="flex items-center gap-3">
              <Image
                src="/hiffi_logo.png"
                alt="Hiffi Logo"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
              <Image
                src="/hiffi_work_red.png"
                alt="Hiffi"
                width={104}
                height={32}
                className="h-6 w-auto object-contain"
              />
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

          <div className="flex items-center gap-2 md:gap-4 pr-2 sm:pr-3 md:pr-4 flex-shrink-0">
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
                  <Link href={buildLoginUrl(pathname, searchParamsString)}>Log in</Link>
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

// Public Navbar component wrapped in Suspense
export function Navbar({ onMenuClick, currentFilter }: NavbarProps) {
  return (
    <Suspense fallback={
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-3 md:px-4 flex-shrink-0">
            <Link href="/home" className="flex items-center gap-3">
              <Image
                src="/hiffi_logo.png"
                alt="Hiffi Logo"
                width={56}
                height={56}
                className="object-contain"
                priority
              />
              <Image
                src="/hiffi_work_red.png"
                alt="Hiffi"
                width={104}
                height={32}
                className="h-6 w-auto object-contain"
              />
            </Link>
          </div>
        </div>
      </header>
    }>
      <NavbarContent onMenuClick={onMenuClick} currentFilter={currentFilter} />
    </Suspense>
  )
}
