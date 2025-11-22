"use client"

import Link from "next/link"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Upload, Bell, Menu, UserIcon, LogOut } from "lucide-react"
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
import { useState } from "react"
import { getColorFromName, getAvatarLetter } from "@/lib/utils"

export function Navbar({ onMenuClick }: { onMenuClick?: () => void }) {
  const { user, userData, logout } = useAuth()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center px-4">
          <div className="flex items-center gap-4 md:gap-6">
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
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">H</span>
              </div>
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

          <div className="flex items-center gap-2 md:gap-4">
            {user && userData ? (
              <>
                <Button variant="ghost" size="icon" asChild className="hidden md:flex">
                  <Link href="/upload">
                    <Upload className="h-5 w-5" />
                    <span className="sr-only">Upload</span>
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" className="hidden md:flex">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={userData.avatar_url || userData.avatarUrl || userData.profilepicture || ""}
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
                    <DropdownMenuItem asChild>
                      <Link href="/upload">
                        <Upload className="mr-2 h-4 w-4" />
                        <span>Upload Video</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
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
    </>
  )
}
