declare global {
  interface Window {
    HifiAnalytics?: {
      init(opts: {
        baseUrl?: string
        batchPath?: string
        identifyPath?: string
        buildId?: string
        ingestKey?: string | null
        autocapture?: boolean
        flushIntervalMs?: number
        maxBatch?: number
      }): void
      capture(tag: string, properties?: Record<string, unknown>): void
      identify(uid: string | null): void
      flush(): void
      flushBeacon(): void
    }
    __hifiAnalyticsInitialized?: boolean
  }
}

export {}
