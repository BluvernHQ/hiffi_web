import { NextRequest, NextResponse } from "next/server"
import { getApiBaseUrl } from "@/lib/config"

type RouteContext = { params: Promise<{ id: string }> }

/** DELETE /admin/discovery-source/{id} via same-origin proxy. */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const authHeader = request.headers.get("authorization")
    const targetUrl = `${getApiBaseUrl()}/admin/discovery-source/${encodeURIComponent(id)}`

    const response = await fetch(targetUrl, {
      method: "DELETE",
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        Accept: "application/json",
      },
      cache: "no-store",
    })

    const text = await response.text()
    return new NextResponse(text, {
      status: response.status,
      headers: {
        "content-type": response.headers.get("content-type") || "application/json",
      },
    })
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to proxy admin discovery source delete request." },
      { status: 502 },
    )
  }
}
