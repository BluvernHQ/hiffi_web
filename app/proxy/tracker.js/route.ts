import { NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

const ADMIN_CAPTURE_GUARD = `
  function isAdminAnalyticsSurface() {
    try {
      return typeof window !== 'undefined' && window.location.pathname.indexOf('/admin') === 0;
    } catch (e) {
      return false;
    }
  }
`

export async function GET() {
  try {
    const upstream = `${getApiBaseUrl().replace(/\/$/, "")}/tracker.js`
    const res = await fetch(upstream, { cache: "no-store" })
    let body = await res.text()
    // Drop admin-panel events before they enter the batch queue (autocapture + internal capture).
    body = body.replace(
      "(function (global) {",
      `(function (global) {${ADMIN_CAPTURE_GUARD}`,
    )
    body = body.replace(
      "function capture(eventName, props) {\n    if (!eventName) return;",
      "function capture(eventName, props) {\n    if (!eventName) return;\n    if (isAdminAnalyticsSurface()) return;",
    )
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

