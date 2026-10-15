import { NextRequest, NextResponse } from "next/server"

// Presigned profile/banner/video uploads target Cloudflare R2. Restrict the
// forwarded host so this route can't be abused as an open proxy (SSRF).
const ALLOWED_HOST_SUFFIX = ".r2.cloudflarestorage.com"

/**
 * Same-origin proxy for browser → R2 presigned PUTs.
 *
 * Direct browser PUTs to R2 fail CORS (OPTIONS preflight often returns 403 even
 * when Allowed Origins look correct). Forward bytes server-side instead.
 * Only `host` is signed on typical Hiffi presigned URLs, so Content-Type is free.
 */
export async function PUT(request: NextRequest) {
  const target = request.nextUrl.searchParams.get("url")
  if (!target) {
    return NextResponse.json({ success: false, error: "Missing upload URL." }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(target)
  } catch {
    return NextResponse.json({ success: false, error: "Invalid upload URL." }, { status: 400 })
  }
  if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(ALLOWED_HOST_SUFFIX)) {
    return NextResponse.json({ success: false, error: "Upload URL not allowed." }, { status: 400 })
  }

  try {
    const body = await request.arrayBuffer()
    const contentType =
      request.headers.get("content-type") || "application/octet-stream"
    const response = await fetch(target, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body,
      cache: "no-store",
    })
    if (!response.ok) {
      const detail = await response.text().catch(() => "")
      return NextResponse.json(
        {
          success: false,
          error: `Upload failed (${response.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`,
        },
        { status: 502 },
      )
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy upload." },
      { status: 502 },
    )
  }
}
