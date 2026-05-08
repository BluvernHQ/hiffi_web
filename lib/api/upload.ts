import type { ApiClientContext } from "./context"

export async function uploadVideo(
  ctx: ApiClientContext,
  data: { video_title: string; video_description: string; video_tags: string[] },
): Promise<{
  success: boolean
  bridge_id: string
  gateway_url: string
  gateway_url_thumbnail: string
  message?: string
}> {
  const response = await ctx.request<{
    success?: boolean
    status?: string
    data?: { bridge_id?: string; gateway_url?: string; gateway_url_thumbnail?: string }
    bridge_id?: string
    gateway_url?: string
    gateway_url_thumbnail?: string
    message?: string
  }>(
    "/videos/upload",
    {
      method: "POST",
      body: JSON.stringify(data),
    },
    true,
  )

  const isSuccess = response.status === "success" || response.success
  if (!isSuccess) throw new Error(response.message || "Failed to initiate video upload")

  const bridgeId = response.data?.bridge_id || response.bridge_id
  const gatewayUrl = response.data?.gateway_url || response.gateway_url
  const gatewayUrlThumbnail = response.data?.gateway_url_thumbnail || response.gateway_url_thumbnail

  if (!bridgeId || bridgeId.trim() === "") {
    throw new Error("Upload bridge created but bridge_id is missing from response. Please try again.")
  }
  if (!gatewayUrl || gatewayUrl.trim() === "") {
    throw new Error("Upload bridge created but gateway_url is missing from response. Please try again.")
  }

  return {
    success: true,
    bridge_id: bridgeId,
    gateway_url: gatewayUrl,
    gateway_url_thumbnail: gatewayUrlThumbnail || "",
    message: response.message,
  }
}

export async function acknowledgeUpload(
  ctx: ApiClientContext,
  bridgeId: string,
): Promise<{ success: boolean; message: string }> {
  if (!bridgeId || bridgeId.trim() === "") {
    throw new Error("Bridge ID is required to acknowledge upload. Please try uploading again.")
  }

  const response = await ctx.request<{ success?: boolean; status?: string; message?: string }>(
    `/videos/upload/ack/${bridgeId}`,
    { method: "POST", body: JSON.stringify({}) },
    true,
  )

  if (response.status === "success" || response.success) {
    return { success: true, message: response.message || "Video uploaded successfully" }
  }
  return { success: false, message: response.message || "Failed to acknowledge upload" }
}

export async function uploadFile(
  _ctx: ApiClientContext,
  url: string,
  file: File,
  onProgress?: (progress: number) => void,
  onXhrReady?: (xhr: XMLHttpRequest) => void,
): Promise<void> {
  const fileBuffer = await file.arrayBuffer()
  const startTime = Date.now()

  if (onProgress) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) onProgress((e.loaded / e.total) * 100)
      })

      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve()
        else reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText || xhr.statusText}`))
      })

      xhr.addEventListener("error", () => {
        reject(new Error(`Upload failed: ${xhr.responseText || xhr.statusText || "Network error occurred"}`))
      })

      xhr.addEventListener("abort", () => reject(new Error("Upload was aborted")))

      try {
        xhr.open("PUT", url, true)
        onXhrReady?.(xhr)
        xhr.send(fileBuffer)
      } catch (e) {
        const duration = Date.now() - startTime
        reject(new Error(`Failed to initiate upload after ${duration}ms: ${e instanceof Error ? e.message : "Unknown error"}`))
      }
    })
  }

  const res = await fetch(url, { method: "PUT", body: fileBuffer })
  if (!res.ok) {
    const errorText = await res.text().catch(() => res.statusText)
    throw new Error(`Upload failed with status ${res.status}: ${errorText}`)
  }
}

