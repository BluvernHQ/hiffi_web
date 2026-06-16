import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

export async function GET() {
  try {
    const upstream = `${getApiBaseUrl().replace(/\/$/, "")}/tracker.js`
    const res = await fetch(upstream, { cache: "no-store" })
    let body = await res.text()
    // Route autocapture through HifiAnalytics.capture so app-side dedupe wraps click events.
    body = body.replace(
      "capture('$click', clickPayload);",
      "global.HifiAnalytics.capture('$click', clickPayload);",
    )
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") || "application/javascript; charset=utf-8",
        // Reduce repeated fetches in-page; safe because content changes rarely.
        "cache-control": "public, max-age=300",
      },
    })
  } catch {
    return new NextResponse("/* tracker proxy failed */", {
      status: 502,
      headers: { "content-type": "application/javascript; charset=utf-8" },
    })
  }
}

