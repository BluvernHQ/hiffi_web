"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AppLayout } from "@/components/layout/app-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Home, Search, ArrowLeft, TrendingUp } from "lucide-react"

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const TRENDING_LINKS = [
    { label: "Trending Music", href: "/search?q=music" },

    { label: "Recent Uploads", href: "/" },
  ]

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] px-6 text-center">
        <div className="space-y-12 max-w-2xl w-full">
          {/* Main Error Message */}
          <div className="space-y-4">
            <div className="relative inline-block">
              <h1 className="text-[12rem] font-black tracking-tighter text-muted-foreground/10 select-none leading-none">
                404
              </h1>
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="text-4xl font-bold tracking-tight bg-background px-4">
                  Lost in the stream?
                </h2>
              </div>
            </div>
            <p className="text-muted-foreground text-xl max-w-md mx-auto">
              We couldn't find the page you're looking for. Let's get you back on track.
            </p>
          </div>
          
          {/* Action Area */}
          <div className="grid gap-8 sm:grid-cols-2 items-start text-left">
            {/* Search Option */}
            <div className="space-y-4 p-6 rounded-2xl bg-muted/30 border border-border/50">
              <div className="flex items-center gap-2 font-semibold">
                <Search className="h-5 w-5 text-primary" />
                <h3>Search Hiffi</h3>
              </div>
              <form onSubmit={handleSearch} className="relative">
                <Input
                  type="text"
                  placeholder="What are you looking for?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10 h-12 rounded-xl bg-background border-border/50 focus:border-primary"
                />
                <button 
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Search className="h-5 w-5" />
                </button>
              </form>
            </div>

            {/* Quick Links */}
            <div className="space-y-4 p-6 rounded-2xl bg-muted/30 border border-border/50 h-full">
              <div className="flex items-center gap-2 font-semibold">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3>Quick Destinations</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_LINKS.map((link) => (
                  <Button key={link.label} variant="outline" size="sm" asChild className="rounded-full bg-background hover:bg-muted border-border/50">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button variant="ghost" onClick={() => router.back()} className="rounded-full px-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
            <Button asChild size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Return to Discover
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
