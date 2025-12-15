const API_BASE_URL = "https://beta.hiffi.com/api"
const TOKEN_KEY = "hiffi_auth_token"
const USERNAME_COOKIE = "hiffi_username"
const PASSWORD_COOKIE = "hiffi_password"

export interface ApiError {
  message: string
  status: number
}

// Cookie utilities
function setCookie(name: string, value: string, days: number = 30): void {
  if (typeof document === "undefined") return
  const expires = new Date()
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000)
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Strict`
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null
  const nameEQ = name + "="
  const ca = document.cookie.split(";")
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) === " ") c = c.substring(1, c.length)
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length))
  }
  return null
}

function deleteCookie(name: string): void {
  if (typeof document === "undefined") return
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`
}

class ApiClient {
  private isRefreshing = false
  private refreshPromise: Promise<string | null> | null = null

  // Store and retrieve JWT token
  setAuthToken(token: string): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(TOKEN_KEY, token)
    }
  }

  getAuthToken(): string | null {
    if (typeof window !== "undefined") {
      return localStorage.getItem(TOKEN_KEY)
    }
    return null
  }

  clearAuthToken(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  // Store credentials in cookies
  setCredentials(username: string, password: string): void {
    setCookie(USERNAME_COOKIE, username)
    setCookie(PASSWORD_COOKIE, password)
  }

  // Get credentials from cookies
  getCredentials(): { username: string | null; password: string | null } {
    return {
      username: getCookie(USERNAME_COOKIE),
      password: getCookie(PASSWORD_COOKIE),
    }
  }

  // Clear credentials from cookies
  clearCredentials(): void {
    deleteCookie(USERNAME_COOKIE)
    deleteCookie(PASSWORD_COOKIE)
  }

  // Auto-login using stored credentials
  private async autoLogin(): Promise<string | null> {
    // Prevent multiple simultaneous login attempts
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = (async () => {
      try {
        const credentials = this.getCredentials()
        if (!credentials.username || !credentials.password) {
          console.log("[API] No stored credentials for auto-login")
          return null
        }

        console.log("[API] Attempting auto-login with stored credentials")
        const response = await this.login({
          username: credentials.username,
          password: credentials.password,
        })

        if (response.success && response.data.token) {
          console.log("[API] Auto-login successful")
          return response.data.token
        }

        return null
      } catch (error) {
        console.error("[API] Auto-login failed:", error)
        // Clear invalid credentials
        this.clearCredentials()
        return null
      } finally {
        this.isRefreshing = false
        this.refreshPromise = null
      }
    })()

    return this.refreshPromise
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, requiresAuth = false): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const method = options.method || "GET"
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    }

    if (requiresAuth) {
      const token = this.getAuthToken()
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
        let finalResponse = response
        let retried = false
        
        // Handle 401 Unauthorized - try auto-login if we have stored credentials
        if (response.status === 401 && requiresAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register')) {
          console.log("[API] Got 401, attempting auto-login with stored credentials")
          const newToken = await this.autoLogin()
          
          if (newToken) {
            // Retry the original request with the new token
            console.log("[API] Retrying request with new token")
            headers["Authorization"] = `Bearer ${newToken}`
            
            const retryResponse = await fetch(url, {
              ...options,
              headers,
            })
            
            if (retryResponse.ok) {
              // Success after retry, continue with normal flow
              const retryDuration = Date.now() - startTime
              console.log(`[API] ${method} ${url} - SUCCESS (${retryResponse.status}) after retry in ${retryDuration}ms`)
              
              // Handle empty responses
              if (retryResponse.status === 204 || retryResponse.headers.get("content-length") === "0") {
                return {} as T
              }
              
              const retryData = await retryResponse.json()
              // Log response data
              const responsePreview = JSON.stringify(retryData).substring(0, 500)
              if (responsePreview.length < JSON.stringify(retryData).length) {
                console.log(`[API] Response:`, responsePreview + "...")
              } else {
                console.log(`[API] Response:`, retryData)
              }
              
              return retryData
            } else {
              // Retry also failed, use retry response for error handling
              finalResponse = retryResponse
              retried = true
            }
          }
        }

        const errorText = await finalResponse.text().catch(() => finalResponse.statusText)
        const finalDuration = Date.now() - startTime
        console.error(`[API] ${method} ${url} - FAILED (${finalResponse.status})${retried ? ' after retry' : ''} in ${finalDuration}ms`)
        console.error(`[API] Error response:`, errorText.substring(0, 200))
        
        // Try to parse error response as JSON to get user-friendly message
        let errorMessage = `API Error: ${response.statusText}`
        try {
          const errorData = JSON.parse(errorText)
          // Check for common error response formats
          if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.detail) {
            errorMessage = errorData.detail
          } else if (typeof errorData === 'string') {
            errorMessage = errorData
          }
        } catch {
          // If parsing fails, use the raw text if available
          if (errorText && errorText.trim().length > 0) {
            errorMessage = errorText
          }
        }
        
        // Provide user-friendly messages for common HTTP status codes
        if (response.status === 401) {
          // Check if this is an auth endpoint
          if (endpoint.includes('/auth/login') || endpoint.includes('/auth/register')) {
            errorMessage = "Invalid username or password. Please check your credentials and try again."
          } else {
            errorMessage = "You are not authorized to perform this action. Please log in."
          }
        } else if (response.status === 400) {
          errorMessage = errorMessage || "Invalid request. Please check your input and try again."
        } else if (response.status === 404) {
          errorMessage = errorMessage || "The requested resource was not found."
        } else if (response.status === 409) {
          errorMessage = errorMessage || "This resource already exists. Please try a different value."
        } else if (response.status === 500) {
          errorMessage = "Server error. Please try again later."
        }
        
        const error: ApiError = {
          message: errorMessage,
          status: finalResponse.status,
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

  // Auth endpoints
  async register(data: { username: string; name: string; password: string }): Promise<{
    success: boolean
    data: {
      id: number
      token: string
      uid: string
      user: {
        name: string
        uid: string
        username: string
      }
    }
  }> {
    const response = await this.request<{
      success: boolean
      data: {
        id: number
        token: string
        uid: string
        user: {
          name: string
          uid: string
          username: string
        }
      }
    }>(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false,
    )
    
    // Store the token
    if (response.success && response.data.token) {
      this.setAuthToken(response.data.token)
    }
    
    return response
  }

  async login(data: { username: string; password: string }): Promise<{
    success: boolean
    data: {
      token: string
      user: {
        name: string
        uid: string
        username: string
      }
    }
  }> {
    const response = await this.request<{
      success: boolean
      data: {
        token: string
        user: {
          name: string
          uid: string
          username: string
        }
      }
    }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false,
    )
    
    // Store the token
    if (response.success && response.data.token) {
      this.setAuthToken(response.data.token)
      // Store credentials in cookies for auto-login
      this.setCredentials(data.username, data.password)
    }
    
    return response
  }

  // User endpoints
  async checkUsernameAvailability(username: string): Promise<{
    success: boolean
    data: {
      available: boolean
      username: string
    }
  }> {
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

  async getCurrentUser(): Promise<{ success: boolean; user?: any; data?: { user: any } }> {
    const response = await this.request<{ success: boolean; user?: any; data?: { user: any } }>("/users/self", {}, true)
    // Normalize response to always have user at top level
    if (response.success && response.data?.user && !response.user) {
      return {
        success: response.success,
        user: response.data.user,
      }
    }
    return response
  }

  async getUserByUsername(username: string): Promise<{ success: boolean; user: any }> {
    return this.request(`/users/${username}`, {}, true)
  }

  async updateSelf(data: { role?: string; name?: string; bio?: string; location?: string; website?: string }): Promise<any> {
    return this.request(
      "/users/self",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true,
    )
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
  async getVideoList(data: { page?: number; limit: number; offset?: number; seed?: string; search?: string }): Promise<{ videos: any[] }> {
    const token = this.getAuthToken()
    
    // Build query parameters
    const params = new URLSearchParams()
    params.append("limit", data.limit.toString())
    
    // Use offset if provided, otherwise calculate from page
    if (data.offset !== undefined) {
      params.append("offset", data.offset.toString())
    } else if (data.page !== undefined) {
      const offset = (data.page - 1) * data.limit
      params.append("offset", offset.toString())
    } else {
      // Default to offset 0 if neither page nor offset is provided
      params.append("offset", "0")
    }
    
    // Add seed (username) if provided
    if (data.seed) {
      params.append("seed", data.seed)
    }
    
    // Add search if provided (keeping for backward compatibility)
    if (data.search) {
      params.append("search", data.search)
    }
    
    const queryString = params.toString()
    const endpoint = `/videos/list${queryString ? `?${queryString}` : ""}`
    
    return this.request(
      endpoint,
      {
        method: "GET",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      false,
    )
  }

  async vectorSearch(searchQuery: string): Promise<{ status: string; videos: any[] }> {
    const token = this.getAuthToken()
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
    const token = this.getAuthToken()
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
