import type { NextRequest } from "next/server"
import { proxyAdminGet } from "@/lib/http/proxy-admin-get"

export function GET(request: NextRequest) {
  return proxyAdminGet(request, "/recommend/admin/pools")
}
