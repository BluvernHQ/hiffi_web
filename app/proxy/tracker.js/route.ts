import { NextResponse } from "next/server"
import { API_BASE_URL } from "@/lib/config"

export async function GET() {
  try {
    const upstream = `${API_BASE_URL.replace(/\/$/, "")}/tracker.js`
    const res = await fetch(upstream, { cache: "no-store" })
    const body = await res.text()
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

