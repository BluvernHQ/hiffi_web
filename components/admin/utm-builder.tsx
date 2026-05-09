"use client"

import { useState, useMemo, useEffect } from "react"
import { Copy, Check, Link as LinkIcon, AlertCircle, Save, Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { apiClient } from "@/lib/api-client"

function formatUtmParam(val: string) {
  // auto-format: lowercase, replace spaces with underscores, remove non-alphanumeric/hyphen/underscore
  return val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')
}

function parseDestinationUrl(
  raw: string,
  opts?: { requiredOrigin?: string },
): { ok: true; url: URL; origin: URL } | { ok: false; error: string } {
  const input = raw.trim()
  if (!input) return { ok: false, error: "" }

  let parsed: URL
  try {
    parsed = new URL(input.includes("://") ? input : `https://${input}`)
  } catch {
    return { ok: false, error: "Enter valid domain (example: hiffi.app)" }
  }

  const protocol = parsed.protocol.toLowerCase()
  if (protocol !== "http:" && protocol !== "https:") {
    return { ok: false, error: "Only http/https URLs allowed" }
  }

  if (opts?.requiredOrigin) {
    try {
      const required = new URL(opts.requiredOrigin)
      if (parsed.hostname !== required.hostname) {
        return { ok: false, error: `Destination domain must match current site (${required.hostname})` }
      }
      // If current site has explicit port, require it. Helps avoid cross-origin surprises in dev.
      if (required.port && parsed.port !== required.port) {
        return { ok: false, error: `Destination port must match current site (${required.port})` }
      }
    } catch {
      // ignore invalid requiredOrigin
    }
  }

  return { ok: true, url: parsed, origin: new URL(parsed.origin) }
}

export function AdminUtmBuilder({ onCancel }: { onCancel?: () => void } = {}) {
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [urlError, setUrlError] = useState("")

  const requiredOrigin = useMemo(() => {
    if (typeof window === "undefined") return undefined
    return window.location.origin
  }, [])
  
  const [source, setSource] = useState("")
  const [medium, setMedium] = useState("")
  const [campaign, setCampaign] = useState("")
  const [term, setTerm] = useState("")
  const [content, setContent] = useState("")
  
  const [copied, setCopied] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedUrl, setLastSavedUrl] = useState("")

  // Validate URL
  useEffect(() => {
    if (!url) {
      setUrlError("")
      return
    }
    const parsed = parseDestinationUrl(url, { requiredOrigin })
    setUrlError(parsed.ok ? "" : parsed.error)
  }, [url, requiredOrigin])

  const isValid = useMemo(() => {
    const isUrlValid = url.length > 0 && urlError === ""
    return isUrlValid && source.length > 0 && medium.length > 0 && campaign.length > 0
  }, [url, urlError, source, medium, campaign])

  const generatedUrl = useMemo(() => {
    if (!isValid) return ""
    try {
      const parsed = parseDestinationUrl(url, { requiredOrigin })
      if (!parsed.ok) return ""
      const parsedUrl = new URL(parsed.url.toString())
      parsedUrl.searchParams.set("utm_source", source)
      parsedUrl.searchParams.set("utm_medium", medium)
      parsedUrl.searchParams.set("utm_campaign", campaign)
      if (term) parsedUrl.searchParams.set("utm_term", term)
      if (content) parsedUrl.searchParams.set("utm_content", content)
      return parsedUrl.toString()
    } catch {
      return ""
    }
  }, [url, source, medium, campaign, term, content, isValid])

  const isDuplicateInSession = useMemo(
    () => generatedUrl.length > 0 && generatedUrl === lastSavedUrl,
    [generatedUrl, lastSavedUrl],
  )

  const handleCopy = () => {
    if (!generatedUrl) return
    navigator.clipboard.writeText(generatedUrl)
    setCopied(true)
    toast({
      title: "URL Copied!",
      description: "The campaign URL has been copied to your clipboard.",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSave = async () => {
    if (!isValid || !generatedUrl) return
    if (isDuplicateInSession) {
      toast({
        title: "Already saved",
        description: "This link already exists in the current session.",
      })
      return
    }
    setIsSaving(true)
    try {
      const res = await apiClient.adminCreateUtmGeneratedUrl({
        url: generatedUrl,
        utm_source: source,
        label: campaign
      })
      if (res.success !== false) {
        setLastSavedUrl(generatedUrl)
        toast({ title: "Success", description: "URL has been saved successfully." })
      } else {
        const normalizedError = String(res.error || "").toLowerCase()
        if (normalizedError.includes("duplicate") || normalizedError.includes("already")) {
          setLastSavedUrl(generatedUrl)
          toast({ title: "Already saved", description: "This link already exists." })
        } else {
          toast({ title: "Error", description: res.error || "Failed to save URL.", variant: "destructive" })
        }
      }
    } catch (e) {
      const error = e as { status?: number; message?: string; responseBody?: string }
      const normalizedMessage = String(error?.message || "").toLowerCase()
      const normalizedBody = String(error?.responseBody || "").toLowerCase()
      const isDuplicateError =
        error?.status === 409 || normalizedMessage.includes("already exists") || normalizedBody.includes("already exists")

      if (isDuplicateError) {
        setLastSavedUrl(generatedUrl)
        toast({ title: "Already saved", description: "This link already exists." })
      } else {
        toast({ title: "Error", description: "Failed to save URL.", variant: "destructive" })
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setUrl("")
    setUrlError("")
    setSource("")
    setMedium("")
    setCampaign("")
    setTerm("")
    setContent("")
    setCopied(false)
    setLastSavedUrl("")
    onCancel?.()
  }

  return (
    <Card className="mb-6 shadow-md border-primary/10 overflow-hidden">
      <CardHeader className="bg-muted/30 pb-4 border-b">
        <CardTitle className="text-xl flex items-center gap-2">
          <LinkIcon className="h-5 w-5 text-primary" />
          Campaign URL Builder
        </CardTitle>
        <CardDescription className="text-sm">
          Generate trackable URLs for your marketing campaigns. Standardizing UTM tags ensures accurate analytics.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="base_url" className="text-sm font-semibold flex items-center gap-1">
              Destination URL <span className="text-destructive">*</span>
            </Label>
            <Input
              id="base_url"
              placeholder={requiredOrigin ? new URL(requiredOrigin).host : "hiffi.app"}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className={cn("font-mono text-sm", urlError && "border-destructive focus-visible:ring-destructive")}
            />
            {urlError && (
              <p className="text-xs text-destructive flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                {urlError}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 bg-muted/10 p-4 rounded-lg border">
            <div className="space-y-2">
              <Label htmlFor="b_source" className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                <span>Source <span className="text-destructive">*</span></span>
              </Label>
              <Input
                id="b_source"
                placeholder="instagram, complex_mag"
                value={source}
                onChange={(e) => setSource(formatUtmParam(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b_medium" className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                <span>Medium <span className="text-destructive">*</span></span>
              </Label>
              <Input
                id="b_medium"
                placeholder="social, email_blast"
                value={medium}
                onChange={(e) => setMedium(formatUtmParam(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b_campaign" className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                <span>Campaign <span className="text-destructive">*</span></span>
              </Label>
              <Input
                id="b_campaign"
                placeholder="summer_drop, new_artist_promo"
                value={campaign}
                onChange={(e) => setCampaign(formatUtmParam(e.target.value))}
              />
            </div>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2 p-4 rounded-lg border border-dashed">
             <div className="space-y-2">
              <Label htmlFor="b_term" className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                <span>Term</span>
                <span className="font-normal opacity-70">(Optional)</span>
              </Label>
              <Input
                id="b_term"
                placeholder="underground_rap, drill_beats"
                value={term}
                onChange={(e) => setTerm(formatUtmParam(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b_content" className="text-xs font-semibold uppercase text-muted-foreground flex justify-between">
                <span>Content</span>
                <span className="font-normal opacity-70">(Optional)</span>
              </Label>
              <Input
                id="b_content"
                placeholder="bio_link, swipe_up_video"
                value={content}
                onChange={(e) => setContent(formatUtmParam(e.target.value))}
              />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-muted/40 border-t p-6 flex flex-col items-start gap-3">
        <Label className="text-sm font-semibold uppercase text-muted-foreground">Generated Campaign URL</Label>
        <div className="flex w-full items-center gap-3 flex-wrap sm:flex-nowrap">
          <Input 
            readOnly 
            value={generatedUrl || "Fill in required fields to generate URL"} 
            className={cn(
              "font-mono text-sm h-12 shadow-inner transition-colors",
              generatedUrl ? "bg-background text-foreground" : "bg-muted/50 text-muted-foreground/60 italic"
            )}
            onFocus={(e) => e.target.select()}
          />
          <Button 
            onClick={handleCopy} 
            size="lg"
            className={cn(
              "shrink-0 h-12 w-full sm:w-auto min-w-[140px] transition-all font-semibold",
              copied ? "bg-green-600 hover:bg-green-700 text-white" : ""
            )}
            disabled={!isValid}
          >
            {copied ? (
              <>
                <Check className="h-5 w-5 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-5 w-5 mr-2" />
                Copy URL
              </>
            )}
          </Button>
          <Button 
            onClick={handleSave} 
            size="lg"
            variant="outline"
            className="shrink-0 h-12 w-full sm:w-auto font-semibold"
            disabled={!isValid || isSaving || isDuplicateInSession}
          >
            {isSaving ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <Save className="h-5 w-5 mr-2" />}
            {isDuplicateInSession ? "Already Saved" : "Save Link"}
          </Button>
          <Button
            type="button"
            onClick={handleCancel}
            size="lg"
            variant="ghost"
            className="shrink-0 h-12 w-full sm:w-auto font-semibold"
            disabled={isSaving}
          >
            Cancel
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
