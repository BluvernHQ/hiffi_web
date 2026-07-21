"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { captureScreenshot, dataUrlToBlob, isScreenshotSupported } from "@/lib/feedback/capture-screenshot"
import { HelpCircle, Loader2, Monitor, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"
import { APP_VERSION } from "@/lib/app-version"

const MAX_DESCRIPTION_LENGTH = 1000

export interface FeedbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { toast } = useToast()
  const [description, setDescription] = useState("")
  const [descriptionError, setDescriptionError] = useState<string | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [allowContact, setAllowContact] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submitLockRef = useRef(false)

  const resetForm = useCallback(() => {
    setDescription("")
    setDescriptionError(null)
    setScreenshot(null)
    setCapturing(false)
    setAllowContact(false)
    submitLockRef.current = false
  }, [])

  useEffect(() => {
    if (!open) resetForm()
  }, [open, resetForm])

  const handleCaptureScreenshot = async () => {
    setCapturing(true)
    try {
      const dataUrl = await captureScreenshot()
      if (dataUrl) setScreenshot(dataUrl)
    } catch (err) {
      toast({
        title: "Could not capture screenshot",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setCapturing(false)
    }
  }

  const handleSubmit = async () => {
    if (submitLockRef.current) return
    submitLockRef.current = true

    const trimmed = description.trim()
    if (!trimmed) {
      setDescriptionError("Please describe your feedback.")
      submitLockRef.current = false
      return
    }
    if (trimmed.length > MAX_DESCRIPTION_LENGTH) {
      setDescriptionError(`Maximum ${MAX_DESCRIPTION_LENGTH} characters.`)
      submitLockRef.current = false
      return
    }
    if (/<[^>]*>/.test(description)) {
      setDescriptionError("HTML/script tags are not allowed.")
      submitLockRef.current = false
      return
    }
    setDescriptionError(null)

    try {
      setSubmitting(true)

      // Upload the screenshot first (if any): request a presigned URL, PUT the
      // bytes to R2, then submit the returned CDN URL with the feedback.
      let screenshotUrl: string | undefined
      if (screenshot) {
        const target = await apiClient.requestFeedbackScreenshotUpload()
        await apiClient.uploadFeedbackScreenshot(target.gateway_url, dataUrlToBlob(screenshot))
        screenshotUrl = target.screenshot_url
      }

      await apiClient.submitFeedback({
        description: trimmed,
        allow_contact: allowContact,
        ...(screenshotUrl ? { screenshot_url: screenshotUrl } : {}),
        context: {
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          app_version: APP_VERSION,
          platform: "web",
        },
      })

      toast({
        title: "Feedback sent",
        description: "Thanks for helping us improve Hiffi.",
      })
      handleDialogOpenChange(false)
    } catch (err) {
      toast({
        title: "Feedback not sent",
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      submitLockRef.current = false
    }
  }

  const handleDialogOpenChange = (next: boolean) => {
    if (!next) resetForm()
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent
        className={cn(
          "z-[100] max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg transition-opacity",
          // While capturing, hide the dialog so it doesn't appear in the
          // screenshot of the current tab — only the page underneath is grabbed.
          capturing && "pointer-events-none !opacity-0",
        )}
        overlayClassName={cn("z-[100]", capturing && "!bg-transparent !backdrop-blur-none")}
      >
        <DialogHeader>
          <DialogTitle>Send Feedback</DialogTitle>
          <DialogDescription>Help us improve Hiffi</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="feedback-description">Describe your feedback (required)</Label>
            <Textarea
              id="feedback-description"
              value={description}
              onChange={(e) => {
                const next = e.target.value
                setDescription(next)
                if (descriptionError) setDescriptionError(null)
              }}
              placeholder="Tell us what prompted this feedback…"
              rows={5}
              maxLength={MAX_DESCRIPTION_LENGTH}
              disabled={submitting}
              className={cn(descriptionError && "border-destructive focus-visible:ring-destructive")}
            />
            {descriptionError ? (
              <p className="text-xs text-destructive">{descriptionError}</p>
            ) : (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                Please don&apos;t include any sensitive information
                <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              </p>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-sm">A screenshot will help us better understand your feedback.</p>
            {screenshot ? (
              <div className="relative overflow-hidden rounded-md border">
                {/* Captured screenshot preview */}
                <Image
                  src={screenshot}
                  alt="Captured screenshot"
                  width={512}
                  height={288}
                  unoptimized
                  className="h-auto max-h-36 w-full object-contain sm:max-h-44"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setScreenshot(null)}
                  disabled={submitting}
                  className="absolute right-2 top-2 gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={handleCaptureScreenshot}
                disabled={submitting || capturing || !isScreenshotSupported()}
                className="w-full gap-2 text-primary hover:text-primary"
                data-analytics-name="feedback-capture-screenshot-button"
              >
                {capturing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Capturing…
                  </>
                ) : (
                  <>
                    <Monitor className="h-4 w-4" />
                    Capture Screenshot
                  </>
                )}
              </Button>
            )}
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="feedback-allow-contact"
              checked={allowContact}
              onCheckedChange={(checked) => setAllowContact(checked === true)}
              disabled={submitting}
              className="mt-0.5"
            />
            <Label htmlFor="feedback-allow-contact" className="font-normal leading-snug">
              We may email you for more information or updates
            </Label>
          </div>

          <p className="text-xs leading-relaxed text-muted-foreground">
            Some account and system information may be sent to Hiffi. We will use it to fix problems and improve
            our services, subject to our{" "}
            <Link href="/privacy-policy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms-of-use" className="underline hover:text-foreground">
              Terms of Service
            </Link>
            . We may email you for more information or updates.
          </p>
        </div>

        <DialogFooter>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !description.trim()}
            data-analytics-name="feedback-submitted"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              "Send"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
