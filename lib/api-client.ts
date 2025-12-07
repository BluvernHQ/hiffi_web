import { auth } from "./firebase"

const API_BASE_URL = "https://hiffi.alterwork.in/api"

export interface ApiError {
  message: string
  status: number
}

class ApiClient {
  private async getAuthToken(): Promise<string | null> {
    const user = auth.currentUser
    if (!user) return null

    try {
      const token = await user.getIdToken(true)
      return token
    } catch (error) {
      console.error("[hiffi] Failed to get auth token:", error)
      return null
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, requiresAuth = false): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const method = options.method || "GET"
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (requiresAuth) {
      const token = await this.getAuthToken()
      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }
    }

    // Log API request details
    const requestBody = options.body ? (typeof options.body === "string" ? JSON.parse(options.body) : options.body) : null
    console.log(`[API] ${method} ${url}`)
    if (requestBody && Object.keys(requestBody).length > 0) {
      // Don't log sensitive data - mask token/password fields
      const sanitizedBody = { ...requestBody }
      if (sanitizedBody.password) sanitizedBody.password = "[REDACTED]"
      if (sanitizedBody.token) sanitizedBody.token = "[REDACTED]"
      console.log(`[API] Request body:`, sanitizedBody)
    }
    if (requiresAuth && headers["Authorization"]) {
      console.log(`[API] Authorization: Bearer ${headers["Authorization"].substring(7, 20)}...`)
    }

    const startTime = Date.now()

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const duration = Date.now() - startTime

      if (!response.ok) {
        const errorText = await response.text().catch(() => response.statusText)
        console.error(`[API] ${method} ${url} - FAILED (${response.status}) in ${duration}ms`)
        console.error(`[API] Error response:`, errorText.substring(0, 200))
        
        const error: ApiError = {
          message: `API Error: ${response.statusText}`,
          status: response.status,
        }
        throw error
      }

      // Handle empty responses (204, etc.)
      if (response.status === 204 || response.headers.get("content-length") === "0") {
        console.log(`[API] ${method} ${url} - SUCCESS (${response.status}) in ${duration}ms [No Content]`)
        return {} as T
      }

      const data = await response.json()
      console.log(`[API] ${method} ${url} - SUCCESS (${response.status}) in ${duration}ms`)
      
      // Log response data (limit size to avoid cluttering console)
      const responsePreview = JSON.stringify(data).substring(0, 500)
      if (responsePreview.length < JSON.stringify(data).length) {
        console.log(`[API] Response:`, responsePreview + "...")
      } else {
        console.log(`[API] Response:`, data)
      }

      return data
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(`[API] ${method} ${url} - ERROR after ${duration}ms:`, error)
      throw error
    }
  }

  // User endpoints
  async checkUsernameAvailability(username: string): Promise<{ available: boolean }> {
    return this.request(`/users/availability/${username}`, {}, false)
  }

  async createUser(data: { username: string; name: string }): Promise<any> {
    return this.request(
      "/users/create",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    )
  }

  async getCurrentUser(): Promise<{ success: boolean; user: any }> {
    return this.request("/users/self", {}, true)
  }

  async getUserByUsername(username: string): Promise<{ success: boolean; user: any }> {
    return this.request(`/users/${username}`, {}, true)
  }

  async updateUser(username: string, data: { name?: string; username?: string; role?: string; bio?: string; location?: string; website?: string }): Promise<any> {
    return this.request(
      `/users/${username}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true,
    )
  }

  async deleteUser(username: string): Promise<void> {
    return this.request(
      `/users/${username}`,
      {
        method: "DELETE",
      },
      true,
    )
  }

  // Video endpoints
  async getVideoList(data: { page: number; limit: number; search?: string }): Promise<{ videos: any[] }> {
    const token = await this.getAuthToken()
    return this.request(
      "/videos/list",
      {
        method: "POST",
        body: JSON.stringify(data),
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      false,
    )
  }

  async vectorSearch(searchQuery: string): Promise<{ status: string; videos: any[] }> {
    const token = await this.getAuthToken()
    const encodedQuery = encodeURIComponent(searchQuery.trim())
    return this.request(
      `/videos/vector/search/${encodedQuery}`,
      {
        method: "POST",
        body: JSON.stringify({}), // Empty body for POST request
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      false,
    )
  }

  async uploadVideo(data: { video_title: string; video_description: string; video_tags: string[] }): Promise<{
    bridge_id: string
    gateway_url: string
    gateway_url_thumbnail: string
    message?: string
    status?: string
  }> {
    return this.request(
      "/videos/upload",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      true,
    )
  }

  async acknowledgeUpload(bridgeId: string): Promise<{ status: string; message: string }> {
    return this.request(
      `/videos/upload/ack/${bridgeId}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
  }

  async getVideoUrl(videoPath: string): Promise<{ video_url: string }> {
    const token = await this.getAuthToken()
    // The videoPath should be like "videos/abc123/video.mp4"
    // API endpoint is GET /{videoPath}
    return this.request(
      `/${videoPath}`,
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      false,
    )
  }

  // Social endpoints
  async upvoteVideo(videoId: string): Promise<{ status: string; message: string }> {
    return this.request(
      `/social/videos/upvote/${videoId}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
  }

  async downvoteVideo(videoId: string): Promise<{ status: string; message: string }> {
    return this.request(
      `/social/videos/downvote/${videoId}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
  }

  async postComment(videoId: string, comment: string): Promise<{ status: string; message: string }> {
    return this.request(
      `/social/videos/comment/${videoId}`,
      {
        method: "POST",
        body: JSON.stringify({ comment }),
      },
      true,
    )
  }

  async getComments(videoId: string, page: number, limit: number): Promise<{ comments: any[] }> {
    return this.request(
      `/social/videos/comments/${videoId}`,
      {
        method: "POST",
        body: JSON.stringify({ page, limit }),
      },
      true,
    )
  }

  async postReply(commentId: string, reply: string): Promise<{ status: string; message: string }> {
    return this.request(
      `/social/videos/reply/${commentId}`,
      {
        method: "POST",
        body: JSON.stringify({ reply }),
      },
      true,
    )
  }

  async getReplies(commentId: string, page: number, limit: number): Promise<{ replies: any[] }> {
    return this.request(
      `/social/videos/replies/${commentId}`,
      {
        method: "POST",
        body: JSON.stringify({ page, limit }),
      },
      true,
    )
  }

  async followUser(username: string): Promise<{ status: string; message: string }> {
    return this.request(
      `/social/users/follow/${username}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
  }

  async unfollowUser(username: string): Promise<{ status: string; message: string }> {
    return this.request(
      `/social/users/unfollow/${username}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
  }

  async getFollowingList(username: string, page: number = 1, limit: number = 100): Promise<{
    following: Array<{
      followed_by: string
      followed_to: string
      followed_at: string
    }>
    status: string
  }> {
    return this.request(
      `/social/users/following/${username}`,
      {
        method: "POST",
        body: JSON.stringify({ page, limit }),
      },
      true,
    )
  }

  async checkFollowingStatus(currentUsername: string, targetUsername: string): Promise<boolean> {
    try {
      const response = await this.getFollowingList(currentUsername, 1, 100);
      return response.following.some(
        (follow) => follow.followed_to === targetUsername
      );
    } catch (error) {
      console.error("[hiffi] Failed to check following status:", error);
      return false;
    }
  }

  // Binary file upload to pre-signed URL
  async uploadFile(url: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
    // Log file upload start
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2)
    const fileName = file.name || "unknown"
    console.log(`[API] PUT ${url.substring(0, 100)}...`)
    console.log(`[API] Uploading file: ${fileName} (${fileSizeMB} MB, ${file.type || "no type"})`)
    
    // Convert File to ArrayBuffer - this prevents browser from auto-setting Content-Type
    // Pre-signed URLs with only 'host' in signed headers can't have Content-Type header
    // ArrayBuffer doesn't have a MIME type, so browser won't auto-set Content-Type
    const fileBuffer = await file.arrayBuffer()
    const startTime = Date.now()
    
    // Use XMLHttpRequest if progress tracking is needed, otherwise use fetch
    if (onProgress) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentComplete = (e.loaded / e.total) * 100
            onProgress(percentComplete)
          }
        })

        xhr.addEventListener('load', () => {
          const duration = Date.now() - startTime
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log(`[API] PUT ${url.substring(0, 100)}... - SUCCESS (${xhr.status}) in ${duration}ms`)
            console.log(`[API] File uploaded: ${fileName} (${fileSizeMB} MB)`)
            resolve()
          } else {
            const errorMessage = xhr.responseText || xhr.statusText || `HTTP ${xhr.status}`
            console.error(`[API] PUT ${url.substring(0, 100)}... - FAILED (${xhr.status}) in ${duration}ms`)
            console.error(`[API] Error: ${errorMessage}`)
            reject(new Error(`Upload failed with status ${xhr.status}: ${errorMessage}`))
          }
        })

        xhr.addEventListener('error', () => {
          const duration = Date.now() - startTime
          console.error(`[API] PUT ${url.substring(0, 100)}... - ERROR after ${duration}ms`)
          console.error('[API] Upload error details:', {
            status: xhr.status,
            statusText: xhr.statusText,
            responseText: xhr.responseText?.substring(0, 200),
            readyState: xhr.readyState,
            fileName,
            fileSize: `${fileSizeMB} MB`
          })
          const errorMessage = xhr.responseText || xhr.statusText || 'Network error occurred'
          reject(new Error(`Upload failed: ${errorMessage}`))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload was aborted'))
        })

        try {
          xhr.open('PUT', url, true)
          // Send ArrayBuffer directly - no Content-Type header will be set
          // Pre-signed URL only has 'host' in signed headers, so no other headers allowed
          // ArrayBuffer doesn't have MIME type, preventing Content-Type header
          xhr.send(fileBuffer)
        } catch (error) {
          const duration = Date.now() - startTime
          console.error(`[API] PUT ${url.substring(0, 100)}... - ERROR opening request after ${duration}ms:`, error)
          reject(new Error(`Failed to initiate upload: ${error instanceof Error ? error.message : 'Unknown error'}`))
        }
      })
    } else {
      // Use fetch for simpler upload without progress tracking
      try {
        const response = await fetch(url, {
          method: 'PUT',
          body: fileBuffer, // Send ArrayBuffer directly - no Content-Type header
          // Don't set any headers - pre-signed URL signature only includes 'host'
        })

        const duration = Date.now() - startTime

        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText)
          console.error(`[API] PUT ${url.substring(0, 100)}... - FAILED (${response.status}) in ${duration}ms`)
          console.error(`[API] Error: ${errorText.substring(0, 200)}`)
          throw new Error(`Upload failed with status ${response.status}: ${errorText}`)
        }

        console.log(`[API] PUT ${url.substring(0, 100)}... - SUCCESS (${response.status}) in ${duration}ms`)
        console.log(`[API] File uploaded: ${fileName} (${fileSizeMB} MB)`)
      } catch (error) {
        const duration = Date.now() - startTime
        console.error(`[API] PUT ${url.substring(0, 100)}... - ERROR after ${duration}ms:`, error)
        if (error instanceof Error) {
          throw error
        }
        throw new Error(`Upload failed: ${error}`)
      }
    }
  }

  // Admin endpoints
  async getAllUsers(page: number = 1, limit: number = 100): Promise<{ users: any[]; total: number }> {
    return this.request(
      `/admin/users`,
      {
        method: "POST",
        body: JSON.stringify({ page, limit }),
      },
      true,
    )
  }

  async getAllVideos(page: number = 1, limit: number = 100): Promise<{ videos: any[]; total: number }> {
    return this.request(
      `/admin/videos`,
      {
        method: "POST",
        body: JSON.stringify({ page, limit }),
      },
      true,
    )
  }

  async getAllComments(page: number = 1, limit: number = 100): Promise<{ comments: any[]; total: number }> {
    return this.request(
      `/admin/comments`,
      {
        method: "POST",
        body: JSON.stringify({ page, limit }),
      },
      true,
    )
  }

  async getAllReplies(page: number = 1, limit: number = 100): Promise<{ replies: any[]; total: number }> {
    return this.request(
      `/admin/replies`,
      {
        method: "POST",
        body: JSON.stringify({ page, limit }),
      },
      true,
    )
  }
}

export const apiClient = new ApiClient()
