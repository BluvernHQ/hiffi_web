"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useAuth } from "@/lib/auth-context"
import { buildLoginUrl, buildSignupUrl } from "@/lib/auth-utils"
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
  currentFilter?: 'all' | 'following' | 'liked' | 'history'
}

/** Radix Dialog + Dropdown can leave body pointer-events locked after close; confirm path already forces cleanup. */
function restoreDocumentInteractionsAfterModalClose() {
  if (typeof document === "undefined") return
  const clearIfNoModalOpen = () => {
    const openDialogOverlay = document.querySelector(
      '[data-radix-dialog-overlay][data-state="open"], [data-radix-alert-dialog-overlay][data-state="open"]',
    )
    if (!openDialogOverlay) {
      document.body.style.removeProperty("pointer-events")
      document.body.style.removeProperty("overflow")
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(clearIfNoModalOpen))
  setTimeout(clearIfNoModalOpen, 0)
  setTimeout(clearIfNoModalOpen, 200)
}

// Internal component that uses useSearchParams - wrapped in Suspense
function NavbarContent({ onMenuClick, currentFilter }: NavbarProps) {
  const { user, userData, logout } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const searchParamsString = searchParams.toString() ? `?${searchParams.toString()}` : undefined
  const isAppDownloadPage = pathname === "/app"

  // Hide upload button on following page
  const showUploadButton = pathname !== '/following'

  const closeLogoutDialog = () => {
    setLogoutDialogOpen(false)
    restoreDocumentInteractionsAfterModalClose()
  }

  const handleLogoutDialogOpenChange = (open: boolean) => {
    setLogoutDialogOpen(open)
    if (!open) restoreDocumentInteractionsAfterModalClose()
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
      <header
        className={isAppDownloadPage
          ? "sticky top-0 z-[80] w-full border-b border-black/15 bg-[#f3f0e8]"
          : "sticky top-0 z-[80] w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"}
      >
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-3 md:px-4 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className={isAppDownloadPage ? "h-9 w-9 text-black/70 hover:bg-black/5 hover:text-black" : "h-9 w-9"}
              onClick={onMenuClick}
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <Link href="/" className="flex items-center gap-3" data-analytics-name="navbar-home-logo-link">
              <Image
                src="/appbarlogo.png"
                alt="Hiffi Logo"
                width={132}
                height={32}
                className="h-8 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* Tablet/desktop: full search pill in center; mobile shows nothing here (spacer only) */}
          <div className="flex-1 hidden sm:flex items-center justify-center px-2 min-w-0">
            <div className="relative w-full max-w-[240px] md:max-w-md transition-all duration-300">
              <div
                onClick={() => setIsSearchOpen(true)}
                data-analytics-name="navbar-open-search-button"
                className={
                  isAppDownloadPage
                    ? "group relative flex h-9 w-full cursor-pointer items-center overflow-hidden rounded-full border border-black/15 bg-white/90 shadow-sm transition-all hover:border-black/25 hover:bg-white"
                    : "group relative flex h-9 w-full cursor-pointer items-center overflow-hidden rounded-full border border-input bg-muted/50 transition-all hover:border-primary/30 hover:bg-muted"
                }
              >
                <Search
                  className={
                    isAppDownloadPage
                      ? "absolute left-3 h-4 w-4 text-black/45 transition-colors group-hover:text-[#dc2626]"
                      : "absolute left-3 h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary"
                  }
                />
                <span
                  className={
                    isAppDownloadPage
                      ? "truncate pl-10 pr-4 text-sm text-black/55"
                      : "truncate pl-10 pr-4 text-sm text-muted-foreground"
                  }
                >
                  Search...
                </span>
              </div>
            </div>
          </div>
          {/* Mobile spacer when search hidden in center */}
          <div className="flex-1 sm:hidden" />

          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 pr-2 sm:pr-3 md:pr-4 flex-shrink-0">
            {/* Mobile-only icon search trigger, sits with action cluster */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              data-analytics-name="navbar-open-search-button-mobile"
              aria-label="Open search"
              className={
                isAppDownloadPage
                  ? "sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-black/70 hover:bg-black/5 hover:text-black"
                  : "sm:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
              }
            >
              <Search className="h-5 w-5" />
            </button>
            {user && userData ? (
              <>
                {showUploadButton && (
                  <>
                    {userData.role === "creator" ? (
                      <Button variant="ghost" size="icon" asChild className="hidden md:flex" data-analytics-name="navbar-open-hiffi-studio-button">
                        <Link href="/creator/apply">
                          <Upload className="h-5 w-5" />
                          <span className="sr-only">Hiffi Studio</span>
                        </Link>
                      </Button>
                    ) : (
                      <Button variant="ghost" size="icon" asChild className="hidden md:flex" data-analytics-name="navbar-open-become-creator-button">
                        <Link href="/creator/apply">
                          <Sparkles className="h-5 w-5" />
                          <span className="sr-only">Become Creator</span>
                        </Link>
                      </Button>
                    )}
                  </>
                )}
                <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <ProfilePicture user={userData} size="sm" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userData.name || userData.username}</p>
                        <p className="text-xs leading-none text-muted-foreground">@{userData.username}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${userData.username}`} data-analytics-name="navbar-profile-link">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    {userData.role === "creator" ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/creator/apply" data-analytics-name="navbar-user-menu-hiffi-studio-link">
                            <Video className="mr-2 h-4 w-4" />
                            <span>Hiffi Studio</span>
                          </Link>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem asChild>
                        <Link href="/creator/apply" data-analytics-name="navbar-user-menu-become-creator-link">
                          <Sparkles className="mr-2 h-4 w-4" />
                          <span>Become a Creator</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={(e) => {
                        e.preventDefault()
                        setUserMenuOpen(false)
                        setLogoutDialogOpen(true)
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Button
                  asChild
                  variant="ghost"
                  className="rounded-full px-3 sm:px-5 text-foreground hover:bg-accent"
                  data-analytics-name="navbar-login-button"
                >
                  <Link href={buildLoginUrl(pathname, searchParamsString)}>Log in</Link>
                </Button>
                <Button
                  asChild
                  className="rounded-full px-4 sm:px-6"
                  data-analytics-name="navbar-signup-button"
                >
                  <Link href={buildSignupUrl(pathname, searchParamsString)}>Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <SearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />

      {/* Logout Confirmation Dialog */}
      <Dialog open={logoutDialogOpen} onOpenChange={handleLogoutDialogOpenChange}>
        <DialogContent overlayClassName="bg-black/35 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to logout? You will need to log in again to access your account.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeLogoutDialog} disabled={isLoggingOut}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              data-analytics-name="navbar-logout-confirm-button"
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
      <header className="sticky top-0 z-50 w-full border-b border-black/15 bg-[#f3f0e8]">
        <div className="flex h-16 items-center">
          <div className="flex items-center gap-2 sm:gap-4 px-2 sm:px-3 md:px-4 flex-shrink-0">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/appbarlogo.png"
                alt="Hiffi Logo"
                width={132}
                height={32}
                className="h-8 w-auto object-contain"
                priority
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
