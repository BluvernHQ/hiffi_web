"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Home, Search, ArrowLeft, TrendingUp } from "lucide-react"

const TRENDING_LINKS = [
  { label: "Trending Music", href: "/search?q=music" },
  { label: "Recent Uploads", href: "/" },
]

export function NotFoundContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="w-full max-w-2xl space-y-12">
        <div className="space-y-4">
          <div className="relative inline-block">
            <h1 className="select-none text-[12rem] font-black leading-none tracking-tighter text-muted-foreground/10">
              404
            </h1>
            <div className="absolute inset-0 flex items-center justify-center">
              <h2 className="bg-background px-4 text-4xl font-bold tracking-tight">Lost in the stream?</h2>
            </div>
          </div>
          <p className="mx-auto max-w-md text-xl text-muted-foreground">
            We couldn&apos;t find the page you&apos;re looking for. Let&apos;s get you back on track.
          </p>
        </div>

        <div className="grid items-start gap-8 text-left sm:grid-cols-2">
          <div className="space-y-4 rounded-2xl border border-border/50 bg-muted/30 p-6">
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
                className="h-12 rounded-xl border-border/50 bg-background pr-10 focus:border-primary"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-primary"
              >
                <Search className="h-5 w-5" />
              </button>
            </form>
          </div>

          <div className="h-full space-y-4 rounded-2xl border border-border/50 bg-muted/30 p-6">
            <div className="flex items-center gap-2 font-semibold">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3>Quick Destinations</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRENDING_LINKS.map((link) => (
                <Button
                  key={link.label}
                  variant="outline"
                  size="sm"
                  asChild
                  className="rounded-full border-border/50 bg-background hover:bg-muted"
                >
                  <Link href={link.href}>{link.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
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
  )
}
