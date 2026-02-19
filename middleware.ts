import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

const MAINTENANCE_MODE = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true"

export function middleware(req: NextRequest) {
  if (!MAINTENANCE_MODE) {
    return NextResponse.next()
  }

  const { pathname } = req.nextUrl

  // Allow maintenance page itself and essential assets/APIs
  const isAllowed =
    pathname.startsWith("/maintenance") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/robots.txt") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/appbarlogo") // allow logo used on maintenance page

  if (isAllowed) {
    return NextResponse.next()
  }

  const url = req.nextUrl.clone()
  url.pathname = "/maintenance"
  url.search = ""

  return NextResponse.rewrite(url)
}

// Apply middleware to all application routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|maintenance|favicon.ico|robots.txt|sitemap.xml).*)"],
}

