import { loadWelcomeMailTemplate } from "@/lib/mail-templates/welcome"
import { getRequestOrigin, getSiteOrigin } from "@/lib/seo/site"

export const runtime = "nodejs"

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const firstName = searchParams.get("firstName") ?? undefined
  const absolute = searchParams.get("absolute") === "1"

  const html = await loadWelcomeMailTemplate(
    { firstName },
    {
      absolute,
      origin: absolute ? getSiteOrigin() : getRequestOrigin(request),
    },
  )

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
    },
  })
}
