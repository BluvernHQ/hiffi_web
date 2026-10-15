import type { DiscoverySource } from "@/lib/types/inventory"

export interface WelcomeMailSignupSubmit {
  name: string
  email: string
  discovery_source: DiscoverySource
  discovery_source_other?: string
}

export interface WelcomeMailSignupResponse {
  id: string
  message?: string
  discovery_source: DiscoverySource
  discovery_source_label?: string
  discovery_source_other?: string
}
