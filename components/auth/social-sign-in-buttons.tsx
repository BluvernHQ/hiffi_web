"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth, type SocialProvider } from "@/lib/auth-context"

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.3 14.3A7.2 7.2 0 0 1 4.9 12c0-.8.1-1.6.4-2.3V6.6H1.3A12 12 0 0 0 0 12c0 1.9.5 3.8 1.3 5.4l4-3.1z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
    </svg>
  )
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.8-1-3.1-.9c-1.6.1-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.7-1 1.2-2 1.5-3.1-3.9-1.5-3.7-5.6-1.7-6.1zM14.5 5.8c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z"
      />
    </svg>
  )
}

export function SocialSignInButtons({ redirectPath }: { redirectPath?: string | null }) {
  const { loginWithProvider } = useAuth()
  const [providers, setProviders] = useState<{ google: boolean; apple: boolean }>({
    google: false,
    apple: false,
  })
  const [loading, setLoading] = useState<SocialProvider | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => setProviders({ google: data.google === true, apple: data.apple === true }))
      .catch(() => {})
  }, [])

  if (!providers.google && !providers.apple) return null

  const signIn = async (provider: SocialProvider) => {
    setLoading(provider)
    setError("")
    try {
      await loginWithProvider(provider, redirectPath)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "This sign-in method is currently unavailable")
      setLoading(null)
    }
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>
      <div className={providers.google && providers.apple ? "grid grid-cols-2 gap-3" : "grid grid-cols-1"}>
        {providers.google && (
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-lg"
            disabled={loading !== null}
            onClick={() => signIn("google")}
          >
            {loading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
            Google
          </Button>
        )}
        {providers.apple && (
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full rounded-lg"
            disabled={loading !== null}
            onClick={() => signIn("apple")}
          >
            {loading === "apple" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AppleMark />}
            Apple
          </Button>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
