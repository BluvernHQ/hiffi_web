"use client"

import type React from "react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { adminApiClient } from "@/lib/admin-api-client"
import { redirectAfterAdminLogin, storeAdminSessionFromLogin } from "@/lib/admin-auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function VerifyInviteForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const [otpId, setOtpId] = useState(searchParams.get("id") || "")
  const [otp, setOtp] = useState("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    const id = searchParams.get("id")
    if (id) setOtpId(id)
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otpId.trim() || !otp.trim()) {
      setError("Invite ID and OTP are required")
      return
    }
    setIsVerifying(true)
    setError("")
    try {
      const res = await adminApiClient.verifyInvite(otpId.trim(), otp.trim())
      if (!res.success || !res.data?.admin) {
        setError("Verification failed")
        return
      }
      const session = storeAdminSessionFromLogin(res.data.token, res.data.admin)
      if (!session) {
        setError("Invalid admin session")
        return
      }
      setDone(true)
      toast({ title: "Account verified", description: "Welcome to the admin dashboard." })
      redirectAfterAdminLogin(session, router)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed")
    } finally {
      setIsVerifying(false)
    }
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="font-medium">Verified! Redirecting…</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/20 to-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary mb-4">
            <Shield className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold">Verify admin invite</h1>
          <p className="text-muted-foreground mt-1">Enter the OTP from your invitation email</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Complete setup</CardTitle>
            <CardDescription>Use the password you chose when invited.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="invite-id">Invite ID</Label>
                <Input id="invite-id" value={otpId} onChange={(e) => setOtpId(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invite-otp">OTP</Label>
                <Input id="invite-otp" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isVerifying}>
                {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & sign in"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <Link href="/admin" className="text-primary hover:underline">
                Back to admin login
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminVerifyInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <VerifyInviteForm />
    </Suspense>
  )
}
