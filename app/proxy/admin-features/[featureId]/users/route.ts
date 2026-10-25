import type { NextRequest } from "next/server"
import { proxyAdminGet } from "@/lib/http/proxy-admin-get"

export async function GET(request: NextRequest, { params }: { params: Promise<{ featureId: string }> }) {
  const { featureId } = await params
  return proxyAdminGet(request, `/analytics/features/${encodeURIComponent(featureId)}/users`)
}
