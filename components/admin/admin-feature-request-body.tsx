import type { ParsedFeedbackDescription } from "@/lib/feedback/parse-feature-request"
import { getFeatureRequestDisplayTitle } from "@/lib/feedback/parse-feature-request"

type AdminFeatureRequestBodyProps = {
  parsed: Extract<ParsedFeedbackDescription, { kind: "feature-request" }>
  submitterEmail?: string
}

export function AdminFeatureRequestBody({ parsed, submitterEmail }: AdminFeatureRequestBodyProps) {
  const featureName = getFeatureRequestDisplayTitle(parsed, { email: submitterEmail })

  return (
    <div className="space-y-5">
      {featureName ? (
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Feature name</p>
          <p className="text-lg font-semibold leading-snug text-foreground">{featureName}</p>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Idea</p>
        <blockquote className="rounded-lg bg-muted/50 px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] border-l-4 border-primary/30">
          {parsed.idea}
        </blockquote>
      </div>

      {parsed.email ? (
        <div className="rounded-lg border border-dashed bg-muted/20 px-3 py-2.5 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email in submission</p>
          <a href={`mailto:${parsed.email}`} className="mt-1 inline-block text-primary hover:underline break-all">
            {parsed.email}
          </a>
        </div>
      ) : null}
    </div>
  )
}
