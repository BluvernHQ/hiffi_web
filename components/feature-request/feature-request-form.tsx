"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { APP_VERSION } from "@/lib/app-version"
import { cn } from "@/lib/utils"
import { CheckCircle2, Loader2 } from "lucide-react"

const MAX_TITLE_LENGTH = 120
const MAX_IDEA_LENGTH = 4000

const fieldClass =
  "border-0 bg-muted/55 shadow-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:bg-muted/40"

export function FeatureRequestForm() {
  const { toast } = useToast()

  const [title, setTitle] = useState("")
  const [idea, setIdea] = useState("")
  const [allowContact, setAllowContact] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const submitLockRef = useRef(false)

  const clearError = (key: string) => {
    setErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (submitLockRef.current || submitting) return
    submitLockRef.current = true

    const trimmedTitle = title.trim()
    const trimmedIdea = idea.trim()
    const nextErrors: Record<string, string> = {}

    if (!trimmedIdea) {
      nextErrors.idea = "Tell us what you'd like us to build."
    } else if (trimmedIdea.length > MAX_IDEA_LENGTH) {
      nextErrors.idea = `Maximum ${MAX_IDEA_LENGTH} characters.`
    } else if (/<[^>]*>/.test(idea)) {
      nextErrors.idea = "HTML/script tags are not allowed."
    }

    if (trimmedTitle.length > MAX_TITLE_LENGTH) {
      nextErrors.title = `Maximum ${MAX_TITLE_LENGTH} characters.`
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      submitLockRef.current = false
      return
    }

    setErrors({})

    const description = [
      "[Feature request]",
      trimmedTitle ? `Feature name: ${trimmedTitle}` : null,
      "",
      trimmedIdea,
    ]
      .filter((line) => line !== null)
      .join("\n")

    try {
      setSubmitting(true)
      await apiClient.submitFeedback({
        description,
        allow_contact: allowContact,
        context: {
          page_url: window.location.href,
          user_agent: navigator.userAgent,
          app_version: APP_VERSION,
          platform: "web",
        },
      })

      setSubmitted(true)
      toast({
        title: "Feature idea sent",
        description: "Thanks — we're building Hiffi with creators like you.",
      })
    } catch (err) {
      toast({
        title: "Could not send your idea",
        description: err instanceof Error ? err.message : "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
      submitLockRef.current = false
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-border/60 bg-muted/20 px-6 py-10 text-center sm:px-8">
        <CheckCircle2 className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
        <h2 className="mt-4 text-xl font-semibold text-foreground">Thanks for sharing</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
          Your feature idea was sent to the Hiffi team. We review every submission as we plan what to
          build next.
        </p>
        <Button asChild className="mt-6">
          <Link href="/studio">Go to Studio</Link>
        </Button>
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="space-y-6 rounded-xl border border-border/60 bg-card/40 p-6 sm:p-8"
    >
      <div className="space-y-2.5">
        <Label htmlFor="feature-name" className="text-[13px] font-medium text-foreground/85">
          Feature name <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Input
          id="feature-name"
          name="feature-name"
          autoComplete="off"
          value={title}
          onChange={(event) => {
            setTitle(event.target.value)
            clearError("title")
          }}
          placeholder="e.g. Playlist collabs, tour dates on profile…"
          maxLength={MAX_TITLE_LENGTH}
          disabled={submitting}
          className={cn(fieldClass, errors.title && "ring-2 ring-destructive/40")}
        />
        {errors.title ? <p className="text-sm text-destructive">{errors.title}</p> : null}
      </div>

      <div className="space-y-2.5">
        <Label htmlFor="feature-idea" className="text-[13px] font-medium text-foreground/85">
          Your idea <span className="text-primary">*</span>
        </Label>
        <Textarea
          id="feature-idea"
          name="feature-idea"
          autoComplete="off"
          value={idea}
          onChange={(event) => {
            setIdea(event.target.value)
            clearError("idea")
          }}
          placeholder="What should we build? How would it help your music or your audience?"
          rows={7}
          maxLength={MAX_IDEA_LENGTH}
          disabled={submitting}
          className={cn(fieldClass, errors.idea && "ring-2 ring-destructive/40")}
        />
        {errors.idea ? (
          <p className="text-sm text-destructive">{errors.idea}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {idea.trim().length}/{MAX_IDEA_LENGTH} characters
          </p>
        )}
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="feature-allow-contact"
          checked={allowContact}
          onCheckedChange={(checked) => setAllowContact(checked === true)}
          disabled={submitting}
          className="mt-0.5"
        />
        <Label htmlFor="feature-allow-contact" className="font-normal leading-snug">
          Hiffi can email me if we have questions about this idea
        </Label>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Submissions may include your page URL and browser info so we can follow up. See our{" "}
        <Link href="/privacy-policy" className="underline hover:text-foreground">
          Privacy Policy
        </Link>
        .
      </p>

      <Button
        type="submit"
        disabled={submitting || !idea.trim()}
        data-analytics-name="feature-request-submitted"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Submit feature idea"
        )}
      </Button>
    </form>
  )
}
