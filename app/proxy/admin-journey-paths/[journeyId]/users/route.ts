import type { NextRequest } from "next/server"
import { proxyAdminGet } from "@/lib/http/proxy-admin-get"

export async function GET(request: NextRequest, { params }: { params: Promise<{ journeyId: string }> }) {
  const { journeyId } = await params
  return proxyAdminGet(request, `/analytics/journey-paths/${encodeURIComponent(journeyId)}/users`)
}
