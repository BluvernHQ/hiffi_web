"use client"

import type React from "react"
import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { adminApiClient } from "@/lib/admin-api-client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/auth/turnstile-widget"
import { isTurnstileEnabled } from "@/lib/turnstile/config"

function AdminForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [resetId, setResetId] = useState<string | null>(null)
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isRequesting, setIsRequesting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRef = useRef<TurnstileWidgetHandle>(null)
  const router = useRouter()
  const { toast } = useToast()

  const resetTurnstile = () => {
    turnstileRef.current?.reset()
    setTurnstileToken(null)
  }

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isTurnstileEnabled() && !turnstileToken) {
      setError("Please complete the security check.")
      return
    }
    setIsRequesting(true)
    setError("")
    try {
      const res = await adminApiClient.requestPasswordReset(email.trim(), turnstileToken)
      if (!res.success || !res.data?.id) {
        setError("Failed to send reset code.")
        resetTurnstile()
        return
      }
      setResetId(res.data.id)
      resetTurnstile()
      toast({ title: "Reset code sent", description: "Check your email for the OTP." })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Request failed")
      resetTurnstile()
    } finally {
      setIsRequesting(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetId) return
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match")
      return
    }
    if (isTurnstileEnabled() && !turnstileToken) {
      setError("Please complete the security check.")
      return
    }
    setIsVerifying(true)
    setError("")
    try {
      const res = await adminApiClient.verifyPasswordReset({
        id: resetId,
        otp,
        new_password: newPassword,
        turnstile_token: turnstileToken,
      })
      if (!res.success) {
        setError("Password reset failed")
        resetTurnstile()
        return
      }
      setIsSuccess(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Verification failed")
      resetTurnstile()
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    if (isSuccess) {
      const t = setTimeout(() => router.replace("/admin"), 2000)
      return () => clearTimeout(t)
    }
  }, [isSuccess, router])

  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-8 pb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="font-medium">Password updated. Redirecting to login…</p>
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
          <h1 className="text-2xl font-bold">Admin password reset</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{resetId ? "Enter OTP" : "Request reset"}</CardTitle>
            <CardDescription>
              {resetId
                ? "Enter the code from your email and choose a new password."
                : "We will email you a one-time code."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!resetId ? (
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <TurnstileWidget
                  ref={turnstileRef}
                  action="admin_reset_password_request"
                  onToken={setTurnstileToken}
                  className="flex justify-center"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isRequesting || (isTurnstileEnabled() && !turnstileToken)}
                >
                  {isRequesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">OTP</Label>
                  <Input id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pw">New password</Label>
                  <div className="relative">
                    <Input
                      id="new-pw"
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Confirm password</Label>
                  <Input
                    id="confirm-pw"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <TurnstileWidget
                  ref={turnstileRef}
                  action="admin_reset_password_verify"
                  onToken={setTurnstileToken}
                  className="flex justify-center"
                />
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isVerifying || (isTurnstileEnabled() && !turnstileToken)}
                >
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset password"}
                </Button>
              </form>
            )}
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

export default function AdminForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <AdminForgotPasswordForm />
    </Suspense>
  )
}
