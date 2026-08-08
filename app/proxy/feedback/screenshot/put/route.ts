import { NextRequest, NextResponse } from "next/server"

// The presigned upload target is always a Cloudflare R2 endpoint. Restrict the
// forwarded host so this route can't be abused as an open proxy (SSRF).
const ALLOWED_HOST_SUFFIX = ".r2.cloudflarestorage.com"

/**
 * Same-origin proxy for the presigned screenshot PUT.
 *
 * A direct browser PUT to R2 is blocked by CORS (the presigned host doesn't
 * answer the preflight), so we forward the bytes server-side instead. Only the
 * `host` header is signed on the presigned URL, so the Content-Type we send is
 * free to set.
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
    const response = await fetch(target, {
      method: "PUT",
      headers: { "Content-Type": request.headers.get("content-type") || "image/jpeg" },
      body,
      cache: "no-store",
    })
    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Screenshot upload failed (${response.status})` },
        { status: 502 },
      )
    }
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy screenshot upload." },
      { status: 502 },
    )
  }
}
