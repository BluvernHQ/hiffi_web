"use client"

import { useState, useEffect } from "react"
import { HLSTestPlayer } from "@/components/video/hls-test-player"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { WORKERS_BASE_URL } from "@/lib/config"
import { getWorkersApiKey } from "@/lib/storage"
import { AppLayout } from "@/components/layout/app-layout"

export default function TestHLSPage() {
  const [baseUrl, setBaseUrl] = useState(WORKERS_BASE_URL)
  const [videoId, setVideoId] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [config, setConfig] = useState<{ baseUrl: string; videoId: string; apiKey: string } | null>(null)

  // Pre-fill API key on mount if available
  useEffect(() => {
    setApiKey(getWorkersApiKey())
  }, [])

  const handleLoad = () => {
    if (!baseUrl || !videoId) {
      alert("Please enter both R2 Public URL and Video ID")
      return
    }
    setConfig({ baseUrl, videoId, apiKey })
  }

  return (
    <AppLayout>
      <div className="w-full px-4 py-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">HLS Test Player</h1>
            <div className="text-xs font-medium px-2 py-1 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
              Debug Tool
            </div>
          </div>
          
          <Card className="bg-card border-border mb-8 shadow-sm overflow-hidden">
            <div className="h-1 bg-blue-500 w-full" />
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="space-y-2">
                  <Label htmlFor="baseUrl" className="text-sm font-medium text-muted-foreground">R2 Public URL</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://pub-xxxx.r2.dev"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="videoId" className="text-sm font-medium text-muted-foreground">Video ID</Label>
                  <Input
                    id="videoId"
                    placeholder="uuid-here"
                    value={videoId}
                    onChange={(e) => setVideoId(e.target.value)}
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="text-sm font-medium text-muted-foreground">API Key (x-api-key)</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="SECRET_KEY"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-background border-input"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleLoad} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 shadow-lg shadow-blue-500/20 transition-all active:scale-95">
                  Load Stream
                </Button>
              </div>
            </CardContent>
          </Card>

          {config ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <HLSTestPlayer 
                baseUrl={config.baseUrl} 
                videoId={config.videoId} 
                apiKey={config.apiKey} 
              />
              
              <Card className="bg-muted/30 border-dashed border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Active Manifest URL</h3>
                  </div>
                  <div className="relative group">
                    <p className="text-xs font-mono break-all text-foreground/70 bg-background/50 p-3 rounded-md border border-border group-hover:border-blue-500/30 transition-colors">
                      {`${config.baseUrl}/videos/${config.videoId}/hls/master.m3u8`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl bg-muted/5">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-muted-foreground">Enter configuration above to load the player</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}