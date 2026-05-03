"use client"

import { useState, useMemo, useEffect } from "react"
import { Copy, Check, Link as LinkIcon, AlertCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

function formatUtmParam(val: string) {
  // auto-format: lowercase, replace spaces with underscores, remove non-alphanumeric/hyphen/underscore
  return val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_-]/g, '')
}

export function AdminUtmBuilder() {
  const { toast } = useToast()
  const [url, setUrl] = useState("")
  const [urlError, setUrlError] = useState("")
  
  const [source, setSource] = useState("")
  const [medium, setMedium] = useState("")
  const [campaign, setCampaign] = useState("")
  const [term, setTerm] = useState("")
  const [content, setContent] = useState("")
  
  const [copied, setCopied] = useState(false)

  // Validate URL
  useEffect(() => {
    if (!url) {
      setUrlError("")
      return
    }
    try {
      new URL(url.includes("http") ? url : `https://${url}`)
      setUrlError("")
    } catch {
      setUrlError("Please enter a valid URL")
    }
  }, [url])

  const isValid = useMemo(() => {
    const isUrlValid = url.length > 0 && urlError === ""
    return isUrlValid && source.length > 0 && medium.length > 0 && campaign.length > 0
  }, [url, urlError, source, medium, campaign])

  const generatedUrl = useMemo(() => {
    if (!isValid) return ""
    try {
      const parsedUrl = new URL(url.includes("http") ? url : `https://${url}`)
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
              placeholder="https://hiffi.app/watch/cypher2025"
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
        </div>
      </CardFooter>
    </Card>
  )
}
