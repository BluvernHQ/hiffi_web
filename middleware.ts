import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Normalize repeated slashes in path (e.g. //app -> /app) to avoid
  // protocol-relative navigation bugs on the client.
  const normalizedPathname = pathname.replace(/\/{2,}/g, "/")
  if (normalizedPathname !== pathname) {
    const url = req.nextUrl.clone()
    url.pathname = normalizedPathname
    return NextResponse.redirect(url, 308)
  }

  if (!MAINTENANCE_MODE) {
    return NextResponse.next()
  }

  // Allow maintenance page itself and essential assets/APIs
  const isAllowed =
    normalizedPathname.startsWith("/maintenance") ||
    normalizedPathname.startsWith("/_next") ||
    normalizedPathname.startsWith("/api") ||
    normalizedPathname.startsWith("/favicon") ||
    normalizedPathname.startsWith("/robots.txt") ||
    normalizedPathname.startsWith("/sitemap") ||
    normalizedPathname.startsWith("/appbarlogo") // allow logo used on maintenance page

  if (isAllowed) {
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  url.pathname = "/maintenance"
  url.search = ""

  return NextResponse.rewrite(url)
}

// Apply middleware to all application routes except static-ish paths and /health
// (/health is excluded so external uptime checks always reach the handler, even in maintenance)
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|maintenance|favicon.ico|robots.txt|sitemap.xml|health$).*)",
  ],
}

