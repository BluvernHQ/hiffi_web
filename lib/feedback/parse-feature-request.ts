const FEATURE_REQUEST_MARKER = "[Feature request]"

export type ParsedFeedbackDescription =
  | {
      kind: "feature-request"
      title?: string
      email?: string
      idea: string
    }
  | {
      kind: "feedback"
      body: string
    }

function readMetadataLine(
  line: string,
): { key: "title" | "email"; value: string } | null {
  if (line.startsWith("Feature name: ")) {
    return { key: "title", value: line.slice("Feature name: ".length).trim() }
  }
  if (line.startsWith("Title: ")) {
    return { key: "title", value: line.slice("Title: ".length).trim() }
  }
  if (line.startsWith("Email: ")) {
    return { key: "email", value: line.slice("Email: ".length).trim() }
  }
  return null
}

function normalizeFeatureTitle(title?: string): string | undefined {
  const trimmed = title?.trim()
  return trimmed || undefined
}

/** Ignore autofill/name metadata that was saved into the optional feature name field. */
export function getFeatureRequestDisplayTitle(
  parsed: Extract<ParsedFeedbackDescription, { kind: "feature-request" }>,
  options?: { email?: string },
): string | undefined {
  const title = normalizeFeatureTitle(parsed.title)
  if (!title) return undefined

  const emailLocal = options?.email?.split("@")[0]?.trim().toLowerCase()
  const normalizedTitle = title.toLowerCase().replace(/^@/, "")

  if (emailLocal && normalizedTitle === emailLocal) {
    return undefined
  }

  return title
}

/** Split `/feature-request` submissions from generic in-app feedback. */
export function parseFeedbackDescription(description: string): ParsedFeedbackDescription {
  const trimmed = description.trim()
  if (!trimmed.startsWith(FEATURE_REQUEST_MARKER)) {
    return { kind: "feedback", body: description }
  }

  const body = trimmed.slice(FEATURE_REQUEST_MARKER.length).replace(/^\s*\n?/, "")
  const lines = body.split("\n")

  let title: string | undefined
  let email: string | undefined
  let ideaStartIndex = 0

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]
    const metadata = readMetadataLine(line)
    if (metadata) {
      if (metadata.key === "title" && metadata.value) title = metadata.value
      if (metadata.key === "email" && metadata.value) email = metadata.value
      ideaStartIndex = index + 1
      continue
    }
    if (line.trim() === "") {
      ideaStartIndex = index + 1
      break
    }
    ideaStartIndex = index
    break
  }

  const idea = lines.slice(ideaStartIndex).join("\n").trim()

  return {
    kind: "feature-request",
    title,
    email,
    idea: idea || "—",
  }
}

export function isFeatureRequestDescription(description: string): boolean {
  return description.trim().startsWith(FEATURE_REQUEST_MARKER)
}

export function feedbackListTitle(
  description: string,
  options?: { email?: string },
): string {
  const parsed = parseFeedbackDescription(description)
  if (parsed.kind === "feature-request") {
    return getFeatureRequestDisplayTitle(parsed, options) || "Untitled feature idea"
  }
  const firstLine = description.split("\n").find((line) => line.trim())?.trim()
  return firstLine || "Feedback"
}

export function feedbackListPreview(description: string): string {
  const parsed = parseFeedbackDescription(description)
  if (parsed.kind === "feature-request") {
    return parsed.idea
  }
  return description
}
