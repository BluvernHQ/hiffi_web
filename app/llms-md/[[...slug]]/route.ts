import { getLlmsMarkdown } from "@/lib/llms/registry"

type RouteContext = { params: Promise<{ slug?: string[] }> }

export async function GET(_request: Request, context: RouteContext) {
  const { slug = [] } = await context.params
  const pathname = slug.length === 0 ? "/" : `/${slug.join("/")}`
  const body = getLlmsMarkdown(pathname)

  if (!body) {
    return new Response("Not Found", { status: 404 })
  }

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
