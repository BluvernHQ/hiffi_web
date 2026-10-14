"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { adminApiClient, type AuthProviderSetting } from "@/lib/admin-api-client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
}

export function AuthProvidersSettings() {
  const { toast } = useToast()
  const [providers, setProviders] = useState<AuthProviderSetting[] | null>(null)
  const [configured, setConfigured] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setProviders(await adminApiClient.getAuthProviders())
    } catch (err) {
      toast({
        title: "Failed to load login providers",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    }
  }, [toast])

  useEffect(() => {
    load()
    fetch("/api/auth/providers")
      .then((res) => res.json())
      .then((data) => setConfigured(data.configured ?? {}))
      .catch(() => {})
  }, [load])

  const toggle = async (provider: string, enabled: boolean) => {
    setSaving(provider)
    try {
      setProviders(await adminApiClient.updateAuthProvider(provider, enabled))
      toast({ title: `${PROVIDER_LABELS[provider] ?? provider} sign-in ${enabled ? "enabled" : "disabled"}` })
    } catch (err) {
      toast({
        title: "Failed to update provider",
        description: err instanceof Error ? err.message : "Request failed",
        variant: "destructive",
      })
    } finally {
      setSaving(null)
    }
  }

  if (!providers) {
    return <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Social sign-in</CardTitle>
        <CardDescription>
          Turn Google and Apple sign-in on or off for everyone. Changes apply within about 30 seconds.
        </CardDescription>
      </CardHeader>
      <CardContent className="divide-y">
        {providers.map((p) => (
          <div key={p.provider} className="flex items-center justify-between gap-4 py-4">
            <div className="space-y-1">
              <Label htmlFor={`provider-${p.provider}`} className="text-base">
                {PROVIDER_LABELS[p.provider] ?? p.provider}
              </Label>
              {configured[p.provider] === false && (
                <p className="text-xs text-muted-foreground">
                  OAuth credentials are not set on the web server, so this stays hidden even when on.
                </p>
              )}
              {p.updated_at && (
                <p className="text-xs text-muted-foreground">
                  Last changed {new Date(p.updated_at).toLocaleString()}
                  {p.updated_by ? ` by ${p.updated_by}` : ""}
                </p>
              )}
            </div>
            <Switch
              id={`provider-${p.provider}`}
              checked={p.enabled}
              disabled={saving === p.provider}
              onCheckedChange={(checked) => toggle(p.provider, checked)}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
