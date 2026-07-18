import { getApiBaseUrl } from "@/lib/config"
import type { AdminApiClientContext } from "./context"
import { unwrapSuccessData } from "./envelope"
import type {
  InventoryClaimApproveResponse,
  InventoryClaimListResponse,
  InventoryListResponse,
  InventoryUploadResult,
  InventoryClaimStatus,
} from "@/lib/types/inventory"
import {
  normalizeInventoryClaim,
  normalizeInventoryClaimApproveResponse,
  normalizeInventoryEntry,
} from "@/lib/types/inventory"

export async function adminListInventory(
  ctx: AdminApiClientContext,
  params: { limit?: number; offset?: number; search?: string } = {},
): Promise<InventoryListResponse> {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set("limit", String(params.limit))
  if (params.offset != null) sp.set("offset", String(params.offset))
  if (params.search?.trim()) sp.set("search", params.search.trim())

  const endpoint = `/admin/inventory${sp.toString() ? `?${sp.toString()}` : ""}`
  const raw = await ctx.request<unknown>(endpoint, { method: "GET" }, true)
  const data = unwrapSuccessData<InventoryListResponse>(raw)

  const items = Array.isArray(data.items)
    ? data.items.map((item) => normalizeInventoryEntry(item as unknown as Record<string, unknown>))
    : []

  return {
    items,
    limit: Number(data.limit ?? params.limit ?? 50),
    offset: Number(data.offset ?? params.offset ?? 0),
    count: Number(data.count ?? 0),
    has_more: Boolean(data.has_more),
  }
}

export async function adminUploadInventory(
  ctx: AdminApiClientContext,
  file: File,
  options?: {
    onProgress?: (progress: number) => void
    onUploadComplete?: () => void
    signal?: AbortSignal
  },
): Promise<InventoryUploadResult> {
  const form = new FormData()
  form.append("file", file)

  const token = ctx.getAuthToken()
  const url = `${getApiBaseUrl()}/admin/inventory/upload`

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()

    const onAbort = () => {
      xhr.abort()
    }

    if (options?.signal) {
      if (options.signal.aborted) {
        reject(new Error("Upload cancelled"))
        return
      }
      options.signal.addEventListener("abort", onAbort, { once: true })
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && options?.onProgress) {
        options.onProgress((event.loaded / event.total) * 100)
      }
    })

    xhr.upload.addEventListener("load", () => {
      options?.onUploadComplete?.()
    })

    xhr.addEventListener("load", () => {
      if (options?.signal) {
        options.signal.removeEventListener("abort", onAbort)
      }

      const text = xhr.responseText
      let parsed: unknown
      try {
        parsed = text ? JSON.parse(text) : {}
      } catch {
        reject(new Error(text || `Upload failed (${xhr.status})`))
        return
      }

      if (xhr.status === 401) {
        ctx.clearSession()
        reject(Object.assign(new Error("Session expired"), { status: 401 }))
        return
      }

      if (xhr.status < 200 || xhr.status >= 300) {
        const p = parsed as Record<string, unknown>
        const msg =
          (typeof p.error === "string" && p.error) ||
          (typeof p.message === "string" && p.message) ||
          `Upload failed (${xhr.status})`
        reject(new Error(msg))
        return
      }

      try {
        resolve(unwrapSuccessData<InventoryUploadResult>(parsed))
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Upload failed"))
      }
    })

    xhr.addEventListener("error", () => {
      if (options?.signal) {
        options.signal.removeEventListener("abort", onAbort)
      }
      reject(new Error("Upload failed — network error"))
    })

    xhr.addEventListener("abort", () => {
      if (options?.signal) {
        options.signal.removeEventListener("abort", onAbort)
      }
      reject(new Error("Upload cancelled"))
    })

    xhr.open("POST", url, true)
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.send(form)
  })
}

export async function adminListInventoryClaims(
  ctx: AdminApiClientContext,
  params: {
    limit?: number
    offset?: number
    username?: string
    email?: string
    status?: InventoryClaimStatus
  } = {},
): Promise<InventoryClaimListResponse> {
  const sp = new URLSearchParams()
  if (params.limit != null) sp.set("limit", String(params.limit))
  if (params.offset != null) sp.set("offset", String(params.offset))
  if (params.username?.trim()) sp.set("username", params.username.trim())
  if (params.email?.trim()) sp.set("email", params.email.trim())
  if (params.status) sp.set("status", params.status)

  const endpoint = `/admin/inventory/claims${sp.toString() ? `?${sp.toString()}` : ""}`
  const raw = await ctx.request<unknown>(endpoint, { method: "GET" }, true)
  const data = unwrapSuccessData<InventoryClaimListResponse>(raw)

  const items = Array.isArray(data.items)
    ? data.items.map((item) => normalizeInventoryClaim(item as unknown as Record<string, unknown>))
    : []

  return {
    items,
    limit: Number(data.limit ?? params.limit ?? 20),
    offset: Number(data.offset ?? params.offset ?? 0),
    count: Number(data.count ?? 0),
    has_more: Boolean(data.has_more),
    filters: data.filters ?? {},
  }
}

export async function adminApproveInventoryClaim(
  ctx: AdminApiClientContext,
  claimID: string,
): Promise<InventoryClaimApproveResponse> {
  const id = claimID.trim()
  if (!id) throw new Error("claim id is required")

  const raw = await ctx.request<unknown>(
    `/admin/inventory/claims/${encodeURIComponent(id)}/approve`,
    { method: "POST" },
    true,
  )
  const data = unwrapSuccessData<Record<string, unknown>>(raw)
  return normalizeInventoryClaimApproveResponse(data)
}

function parseContentDispositionFilename(header: string | null, fallback: string): string {
  if (!header) return fallback
  const utf8Match = header.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1])
    } catch {
      return utf8Match[1]
    }
  }
  const quotedMatch = header.match(/filename="([^"]+)"/i)
  if (quotedMatch?.[1]) return quotedMatch[1]
  const plainMatch = header.match(/filename=([^;]+)/i)
  if (plainMatch?.[1]) return plainMatch[1].trim()
  return fallback
}

function triggerBrowserDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

async function adminDownloadInventoryFile(
  ctx: AdminApiClientContext,
  endpoint: string,
  fallbackFilename: string,
): Promise<void> {
  const token = ctx.getAuthToken()
  const url = `${getApiBaseUrl()}${endpoint}`

  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })

  if (response.status === 401) {
    ctx.clearSession()
    throw Object.assign(new Error("Session expired"), { status: 401 })
  }

  if (!response.ok) {
    const text = await response.text()
    try {
      const parsed = JSON.parse(text) as Record<string, unknown>
      const msg =
        (typeof parsed.error === "string" && parsed.error) ||
        (typeof parsed.message === "string" && parsed.message) ||
        `Download failed (${response.status})`
      throw new Error(msg)
    } catch (error) {
      if (error instanceof Error && error.message !== `Download failed (${response.status})`) {
        throw error
      }
      throw new Error(text || `Download failed (${response.status})`)
    }
  }

  const blob = await response.blob()
  const filename = parseContentDispositionFilename(
    response.headers.get("Content-Disposition"),
    fallbackFilename,
  )
  triggerBrowserDownload(blob, filename)
}

export async function adminDownloadInventoryTemplate(ctx: AdminApiClientContext): Promise<void> {
  return adminDownloadInventoryFile(ctx, "/admin/inventory/template", "artist-inventory-template.csv")
}

export async function adminExportInventory(
  ctx: AdminApiClientContext,
  params: { created_after?: string; created_before?: string; search?: string } = {},
): Promise<void> {
  const sp = new URLSearchParams()
  if (params.created_after?.trim()) sp.set("created_after", params.created_after.trim())
  if (params.created_before?.trim()) sp.set("created_before", params.created_before.trim())
  if (params.search?.trim()) sp.set("search", params.search.trim())

  const endpoint = `/admin/inventory/export${sp.toString() ? `?${sp.toString()}` : ""}`
  return adminDownloadInventoryFile(ctx, endpoint, "artist-inventory-export.csv")
}
