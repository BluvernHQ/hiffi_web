const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://beta.hiffi.com/api"
const TOKEN_KEY = "hiffi_auth_token"
const USERNAME_COOKIE = "hiffi_username"
const PASSWORD_COOKIE = "hiffi_password"

export interface ApiError {
  message: string
  status: number
}

// Video Types
export interface Video {
  video_id: string
  video_url: string
  video_thumbnail: string
  video_title: string
  video_description: string
  video_tags: string[]
  video_views: number
  video_upvotes: number
  video_downvotes: number
  video_comments: number
  user_uid: string
  user_username: string
  created_at: string
  updated_at: string
  following?: boolean // Added from /videos/list response
  upvoted?: boolean // Added from /videos/{videoId} response
  downvoted?: boolean // Added from /videos/{videoId} response
  streaming_url?: string // Streaming URL (same as video_url, for compatibility)
  userUsername?: string // Alias for user_username (for compatibility)
}

// API response wrapper for video list items
export interface VideoListItem {
  video: Video
  following: boolean
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
        console.log(`[API] Adding Authorization header with token: ${token.substring(0, 20)}...`)
      } else {
        console.warn(`[API] No auth token available for authenticated request to ${endpoint}`)
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
      
      // Provide more helpful error messages for common fetch failures
      if (error instanceof TypeError && error.message.includes('fetch')) {
        const networkError: ApiError = {
          message: `Unable to connect to the API server at ${API_BASE_URL}. Please check your internet connection or try again later.`,
          status: 0,
        }
        console.error(`[API] Network error - API server may be unreachable: ${API_BASE_URL}`)
        throw networkError
      }
      
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
    available: boolean
    username: string
    status?: string
    data?: {
      available: boolean
      username: string
    }
  }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      available?: boolean
      username?: string
      data?: {
        available: boolean
        username: string
      }
    }>(`/users/availability/${username}`, {}, false)
    
    // Normalize response structure
    // API may return: { status: "success", available: true, username: "..." }
    // or: { success: true, data: { available: true, username: "..." } }
    if (response.status === "success" || response.success) {
      if (response.data) {
        return {
          success: true,
          available: response.data.available,
          username: response.data.username,
        }
      }
      return {
        success: response.status === "success" || response.success || false,
        available: response.available || false,
        username: response.username || username,
      }
    }
    
    return {
      success: false,
      available: false,
      username: username,
    }
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

  async getCurrentUser(): Promise<{ success: boolean; user?: any; following?: boolean; data?: { user: any } }> {
    const response = await this.request<{ success: boolean; user?: any; data?: { user: any } }>("/users/self", {}, true)
    
    // Log response for debugging
    console.log("[API] getCurrentUser response:", response)
    
    // Normalize response to always have user at top level
    // API returns: { success: true, data: { user: {...} } }
    // We normalize to: { success: true, user: {...} }
    if (response.success && response.data?.user && !response.user) {
      console.log("[API] Normalizing response structure")
      return {
        success: response.success,
        user: response.data.user,
        following: undefined, // Not applicable for own profile
      }
    }
    
    // If response already has user at top level, return as is
    if (response.success && response.user) {
      return {
        ...response,
        following: undefined, // Not applicable for own profile
      }
    }
    
    // If no user found, return response as is (will be handled by caller)
    return response
  }

  async getUserByUsername(username: string): Promise<{ 
    success: boolean
    user: any
    following?: boolean 
  }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        user: any
        following?: boolean
      }
      user?: any
      following?: boolean
    }>(`/users/${username}`, {}, true)
    
    // Normalize response structure
    // New API format: { success: true, data: { user: {...}, following: false } }
    // Old format: { success: true, user: {...} }
    if (response.success || response.status === "success") {
      // Extract from data object if present
      if (response.data) {
        return {
          success: true,
          user: response.data.user,
          following: response.data.following,
        }
      }
      // Otherwise use top-level fields
      return {
        success: true,
        user: response.user,
        following: response.following,
      }
    }
    
    return {
      success: false,
      user: null,
      following: false,
    }
  }

  // Get profile photo upload URL
  // POST /users/profile-photo/upload - Get pre-signed URL for uploading profile photo
  async getProfilePhotoUploadUrl(): Promise<{
    success: boolean
    gateway_url: string
    path: string
    message?: string
  }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        gateway_url?: string
        path?: string
        message?: string
      }
      gateway_url?: string
      path?: string
      message?: string
    }>(
      "/users/profile-photo/upload",
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { gateway_url: "...", path: "...", message: "..." } }
    // or: { status: "success", gateway_url: "...", path: "...", message: "..." }
    const isSuccess = response.status === "success" || response.success
    
    if (isSuccess) {
      const gatewayUrl = response.data?.gateway_url || response.gateway_url || ""
      const path = response.data?.path || response.path || ""
      
      if (!gatewayUrl || gatewayUrl.trim() === "") {
        throw new Error("Profile photo upload URL is missing from response. Please try again.")
      }
      if (!path || path.trim() === "") {
        throw new Error("Profile photo path is missing from response. Please try again.")
      }
      
      return {
        success: true,
        gateway_url: gatewayUrl,
        path: path,
        message: response.data?.message || response.message,
      }
    }
    
    throw new Error(response.message || "Failed to get profile photo upload URL")
  }

  // Update user profile - officially supports: name, profile_picture
  // Note: Some backends may accept additional fields like role, but this is not documented
  async updateSelf(data: { name?: string; profile_picture?: string; [key: string]: any }): Promise<{ success: boolean; user: any }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      user?: any
      data?: { user: any }
    }>(
      "/users/self",
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { status: "success", user: {...} }
    // or: { success: true, data: { user: {...} } }
    if ((response.status === "success" || response.success) && response.data?.user && !response.user) {
      return {
        success: true,
        user: response.data.user,
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        success: true,
        user: response.user,
      }
    }
    
    return {
      success: false,
      user: null,
    }
  }

  // Update user profile picture - uses PUT /users/{username} with { "image": path }
  async updateUserProfile(username: string, data: { image?: string; name?: string; [key: string]: any }): Promise<{ success: boolean; user?: any }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      user?: any
      data?: { user: any }
    }>(
      `/users/self`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true,
    )
    
    // Normalize response structure
    const isSuccess = response.status === "success" || response.success !== false
    const userData = response.user || response.data?.user || response.data || response
    
    return {
      success: isSuccess,
      user: userData,
    }
  }

  // Note: updateUser is not in the official API docs - users can only update themselves via updateSelf
  // Keeping this for potential admin use, but it may not be supported by the backend
  async updateUser(username: string, data: { name?: string; username?: string; role?: string; bio?: string; location?: string; website?: string }): Promise<any> {
    console.warn("[API] updateUser is not in the official API docs. Use updateSelf instead.")
    return this.request(
      `/users/${username}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      true,
    )
  }

  async deleteUser(username: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
    }>(
      `/users/${username}`,
      {
        method: "DELETE",
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { status: "success", message: "User deleted successfully" }
    if (response.status === "success" || response.success) {
      return {
        success: true,
        message: response.message || "User deleted successfully",
      }
    }
    
    return {
      success: false,
      message: response.message,
    }
  }

  // List Users endpoint - GET /users/list
  async listUsers(params: {
    limit?: number
    offset?: number
    seed?: string
  }): Promise<{
    success: boolean
    users: any[]
    limit: number
    offset: number
    count: number
    seed?: string
  }> {
    // Build query parameters
    const queryParams = new URLSearchParams()
    if (params.limit !== undefined) {
      queryParams.append("limit", params.limit.toString())
    }
    if (params.offset !== undefined) {
      queryParams.append("offset", params.offset.toString())
    }
    if (params.seed) {
      queryParams.append("seed", params.seed)
    }
    
    const queryString = queryParams.toString()
    const endpoint = `/users/list${queryString ? `?${queryString}` : ""}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      users?: any[]
      limit?: number
      offset?: number
      count?: number
      seed?: string
    }>(endpoint, {}, true)
    
    // Normalize response structure
    // API returns: { status: "success", users: [...], limit: 20, offset: 0, count: 2, seed: "..." }
    if (response.status === "success" || response.success) {
      return {
        success: true,
        users: response.users || [],
        limit: response.limit || 20,
        offset: response.offset || 0,
        count: response.count || 0,
        seed: response.seed,
      }
    }
    
    return {
      success: false,
      users: [],
      limit: params.limit || 20,
      offset: params.offset || 0,
      count: 0,
    }
    }
    
  // Video endpoints
  // GET /videos/list - List all videos with deterministic random pagination
  // Note: API actually uses GET with query params, not POST (returns 405 for POST)
  // Response structure: { success: true, data: { videos: [{ video: {...}, following: boolean }], ... } }
  async getFollowingVideos(data: { offset?: number; limit?: number }): Promise<{
    success: boolean
    videos: Video[]
    limit: number
    offset: number
    count: number
  }> {
    const limit = data.limit || 10
    const offset = data.offset !== undefined ? data.offset : 0
    
    // Build query parameters
    const params = new URLSearchParams()
    params.append("offset", offset.toString())
    params.append("limit", limit.toString())
    
    const queryString = params.toString()
    const url = `/videos/list/following?${queryString}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        videos?: Array<{ video: any; following: boolean }>
        limit?: number
        offset?: number
        count?: number
      }
    }>(url, {
      method: "GET",
    }, true) // Requires authentication
    
    // Handle response structure: { success: true, data: { videos: [{ video: {...}, following: boolean }], count, limit, offset } }
    const responseData = response.data
    const videosArray = (responseData?.videos || []) as Array<{ video: any; following: boolean }>
    
    // Extract video objects from the wrapped structure and flatten
    // Transform from: [{ video: {...}, following: boolean, profile_picture: string }] to: [{ ...video, following: boolean, user_profile_picture: string }]
    // Also preserve any user profile picture data
    const videos: Video[] = videosArray.map((item: any) => {
      // If item has 'video' property, it's the wrapped format
      if (item.video) {
        const videoData: any = {
          ...item.video,
          following: item.following || false,
        }
        // Preserve user profile picture from the response
        // API returns profile_picture at the same level as video and following
        // Only set if profile_picture is a non-empty string
        if (item.profile_picture && item.profile_picture.trim() !== "") {
          videoData.user_profile_picture = item.profile_picture.trim()
        }
        // Also check other possible locations for backward compatibility
        if (item.user?.profile_picture && item.user.profile_picture.trim() !== "") {
          videoData.user_profile_picture = item.user.profile_picture.trim()
        }
        if (item.video.user?.profile_picture && item.video.user.profile_picture.trim() !== "") {
          videoData.user_profile_picture = item.video.user.profile_picture.trim()
        }
        if (item.video.profile_picture && item.video.profile_picture.trim() !== "") {
          videoData.user_profile_picture = item.video.profile_picture.trim()
        }
        return videoData
      }
      // Otherwise, it's already in the flat format (backward compatibility)
      return item
    })
    
    return {
      success: response.success !== false,
      videos,
      limit: responseData?.limit || limit,
      offset: responseData?.offset || offset,
      count: responseData?.count || videos.length,
    }
  }

  async getVideoList(data: { offset?: number; limit?: number; seed: string; page?: number }): Promise<{
    success: boolean
    videos: Video[]
    page?: number
    limit: number
    offset: number
    count: number
    seed?: string
  }> {
    // Use offset directly, or calculate from page if provided (for backward compatibility)
    const limit = data.limit || 20
    const offset = data.offset !== undefined ? data.offset : (data.page ? (data.page - 1) * limit : 0)
    
    // Build query parameters - always include seed and offset
    const params = new URLSearchParams()
    params.append("offset", offset.toString())
    params.append("limit", limit.toString())
    params.append("seed", data.seed)
    
    const queryString = params.toString()
    const url = `/videos/list?${queryString}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        videos?: VideoListItem[]
        page?: number
        limit?: number
        offset?: number
        count?: number
        seed?: string
      }
      videos?: VideoListItem[]
      page?: number
      limit?: number
      offset?: number
      count?: number
      seed?: string
    }>(
      url,
      {
        method: "GET",
      },
      false, // Authentication not required per docs
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { videos: [{ video: {...}, following: boolean }], limit: 2, offset: 0, count: 2, seed: "..." } }
    // Legacy format: { status: "success", videos: [...], page: 1, limit: 20, offset: 0, count: 10, seed: "..." }
    const isSuccess = response.status === "success" || response.success
    
    if (isSuccess) {
      // Extract fields from either response.data or directly from response
      const rawVideos = response.data?.videos || response.videos || []
      const responsePage = response.data?.page || response.page
      const responseLimit = response.data?.limit || response.limit
      const responseOffset = response.data?.offset || response.offset
      const responseCount = response.data?.count || response.count
      const responseSeed = response.data?.seed || response.seed
      
      // Transform videos array to flatten structure and include following status
      // New API format: [{ video: {...}, following: boolean, profile_picture: string }]
      // Transform to: [{ ...video, following: boolean, user_profile_picture: string }]
      // Also preserve any user profile picture data
      const videos = rawVideos.map((item: any) => {
        // If item has 'video' property, it's the new format
        if (item.video) {
          const videoData: any = {
            ...item.video,
            following: item.following || false,
          }
          // Preserve user profile picture from the response
          // API returns profile_picture at the same level as video and following
          if (item.profile_picture) {
            videoData.user_profile_picture = item.profile_picture
          }
          // Also check other possible locations for backward compatibility
          if (item.user?.profile_picture) {
            videoData.user_profile_picture = item.user.profile_picture
          }
          if (item.video.user?.profile_picture) {
            videoData.user_profile_picture = item.video.user.profile_picture
          }
          if (item.video.profile_picture) {
            videoData.user_profile_picture = item.video.profile_picture
          }
          return videoData
        }
        // Otherwise, it's already in the old format (backward compatibility)
        return item
      })
      
      return {
        success: true,
        videos: videos,
        page: responsePage,
        limit: responseLimit || limit,
        offset: responseOffset !== undefined ? responseOffset : offset,
        count: responseCount !== undefined ? responseCount : 0,
        seed: responseSeed || data.seed,
      }
    }
    
    return {
      success: false,
      videos: [],
      limit: limit,
      offset: offset,
      count: 0,
    }
  }

  // DEPRECATED: Vector search endpoint was removed from API (see VIDEOS_API.md changelog)
  // Keeping for backward compatibility, but this endpoint may not be available
  async vectorSearch(searchQuery: string): Promise<{ status: string; videos: any[] }> {
    console.warn("[API] vectorSearch is deprecated - endpoint was removed from API")
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

  // POST /videos/upload - Initiate video upload
  async uploadVideo(data: { video_title: string; video_description: string; video_tags: string[] }): Promise<{
    success: boolean
    bridge_id: string
    gateway_url: string
    gateway_url_thumbnail: string
    message?: string
  }> {
    const response = await this.request<{
      success?: boolean
    status?: string
      data?: {
        bridge_id?: string
        gateway_url?: string
        gateway_url_thumbnail?: string
      }
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
    
    // Normalize response structure
    // API may return: 
    // - { status: "success", message: "bridge created", bridge_id: "...", gateway_url: "...", gateway_url_thumbnail: "..." }
    // - { success: true, data: { bridge_id: "...", gateway_url: "...", gateway_url_thumbnail: "..." } }
    const isSuccess = response.status === "success" || response.success
    
    if (isSuccess) {
      // Extract fields from either response.data or directly from response
      const bridgeId = response.data?.bridge_id || response.bridge_id
      const gatewayUrl = response.data?.gateway_url || response.gateway_url
      const gatewayUrlThumbnail = response.data?.gateway_url_thumbnail || response.gateway_url_thumbnail
      
      // Validate required fields are present
      if (!bridgeId || bridgeId.trim() === "") {
        throw new Error("Upload bridge created but bridge_id is missing from response. Please try again.")
      }
      if (!gatewayUrl || gatewayUrl.trim() === "") {
        throw new Error("Upload bridge created but gateway_url is missing from response. Please try again.")
      }

      console.log("[API] Upload bridge created successfully:", {
        bridge_id: bridgeId,
        has_gateway_url: !!gatewayUrl,
        has_thumbnail_url: !!gatewayUrlThumbnail,
      })

      return {
        success: true,
        bridge_id: bridgeId,
        gateway_url: gatewayUrl,
        gateway_url_thumbnail: gatewayUrlThumbnail || "",
        message: response.message,
      }
    }
    
    throw new Error(response.message || "Failed to initiate video upload")
  }

  // POST /videos/upload/ack/{videoID} - Acknowledge video upload
  async acknowledgeUpload(bridgeId: string): Promise<{ success: boolean; message: string }> {
    // Validate bridgeId is provided and not empty
    if (!bridgeId || bridgeId.trim() === "") {
      throw new Error("Bridge ID is required to acknowledge upload. Please try uploading again.")
    }

    console.log("[API] Acknowledging upload with bridge_id:", bridgeId)
    
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
    }>(
      `/videos/upload/ack/${bridgeId}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { status: "success", message: "video uploaded" }
    if (response.status === "success" || response.success) {
      return {
        success: true,
        message: response.message || "Video uploaded successfully",
      }
    }
    
    return {
      success: false,
      message: response.message || "Failed to acknowledge upload",
    }
  }

  // GET /videos/{videoID} - Get video information and streaming URL
  async getVideo(videoId: string): Promise<{
    success: boolean
    video_url: string
    upvoted?: boolean
    downvoted?: boolean
    following?: boolean
    put_view_error?: string
  }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        video_url?: string
        upvoted?: boolean
        downvoted?: boolean
        following?: boolean
        put_view_error?: string
      }
      video_url?: string
      upvoted?: boolean
      downvoted?: boolean
      following?: boolean
      put_view_error?: string
    }>(
      `/videos/${videoId}`,
      {},
      true, // Authentication required to get user-specific states (following, upvoted, downvoted)
    )
    
    // Normalize response structure
    // API may return:
    // - { status: "success", video_url: "...", upvoted: false, downvoted: false, following: false }
    // - { success: true, data: { video_url: "...", upvoted: false, downvoted: false, following: false } }
    const isSuccess = response.status === "success" || response.success
    
    if (isSuccess) {
      // Extract fields from either response.data or directly from response
      const videoUrl = response.data?.video_url || response.video_url || ""
      const upvoted = response.data?.upvoted ?? response.upvoted ?? false
      const downvoted = response.data?.downvoted ?? response.downvoted ?? false
      const following = response.data?.following ?? response.following ?? false
      const putViewError = response.data?.put_view_error || response.put_view_error
      
      return {
        success: true,
        video_url: videoUrl,
        upvoted: upvoted,
        downvoted: downvoted,
        following: following,
        put_view_error: putViewError,
      }
    }
    
    return {
      success: false,
      video_url: "",
      upvoted: false,
      downvoted: false,
      following: false,
    }
  }

  // Legacy method - kept for backward compatibility
  // Use getVideo() instead for new code
  async getVideoUrl(videoPath: string): Promise<{ video_url: string }> {
    console.warn("[API] getVideoUrl is deprecated. Use getVideo(videoId) instead.")
    // Try to extract video ID from path if it's a full path
    const videoId = videoPath.replace(/^videos\//, "").replace(/\/.*$/, "")
    const response = await this.getVideo(videoId)
    return { video_url: response.video_url }
  }

  // DELETE /videos/{videoID} - Delete a video
  async deleteVideo(videoId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
    }>(
      `/videos/${videoId}`,
      {
        method: "DELETE",
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { status: "success", message: "video deleted" }
    if (response.status === "success" || response.success) {
      return {
        success: true,
        message: response.message || "Video deleted successfully",
      }
    }
    
    return {
      success: false,
      message: response.message || "Failed to delete video",
    }
  }

  // GET /videos/list/{username} - List videos by a specific user
  // Response structure: { success: true, data: { videos: [{ video: {...}, following: boolean }], count, limit, offset, username } }
  async getUserVideos(username: string, params: { limit?: number; offset?: number } = {}): Promise<{
    success: boolean
    videos: Video[]
    limit: number
    offset: number
    count: number
    username: string
  }> {
    const limit = params.limit || 20
    const offset = params.offset || 0
    
    // Build query parameters
    const queryParams = new URLSearchParams()
    if (limit !== 20) queryParams.append("limit", limit.toString())
    if (offset !== 0) queryParams.append("offset", offset.toString())
    
    const queryString = queryParams.toString()
    const url = queryString ? `/videos/list/${encodeURIComponent(username)}?${queryString}` : `/videos/list/${encodeURIComponent(username)}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        videos?: VideoListItem[]
        limit?: number
        offset?: number
        count?: number
        username?: string
      }
      videos?: VideoListItem[]
      limit?: number
      offset?: number
      count?: number
      username?: string
    }>(
      url,
      {
        method: "GET",
      },
      false, // Authentication not required per docs
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { videos: [{ video: {...}, following: boolean }], limit: 20, offset: 0, count: 2, username: "sanjeev" } }
    const isSuccess = !!(response.status === "success" || response.success)
    
    if (isSuccess) {
      // Extract fields from either response.data or directly from response
      const rawVideos = response.data?.videos || response.videos || []
      const responseLimit = response.data?.limit ?? response.limit ?? limit
      const responseOffset = response.data?.offset ?? response.offset ?? offset
      const responseCount = response.data?.count ?? response.count ?? 0
      const responseUsername = response.data?.username || response.username || username
      
      // Transform videos array to flatten structure and include following status
      // API format: [{ video: {...}, following: boolean, profile_picture: string }]
      // Transform to: [{ ...video, following: boolean, user_profile_picture: string }]
      // Also preserve any user profile picture data
      const videos = rawVideos.map((item: any) => {
        // If item has 'video' property, it's the new format
        if (item.video) {
          const videoData: any = {
            ...item.video,
            following: item.following || false,
          }
          // Preserve user profile picture from the response
          // API returns profile_picture at the same level as video and following
          // Only set if profile_picture is a non-empty string
          if (item.profile_picture && item.profile_picture.trim() !== "") {
            videoData.user_profile_picture = item.profile_picture.trim()
          }
          // Also check other possible locations for backward compatibility
          if (item.user?.profile_picture && item.user.profile_picture.trim() !== "") {
            videoData.user_profile_picture = item.user.profile_picture.trim()
          }
          if (item.video.user?.profile_picture && item.video.user.profile_picture.trim() !== "") {
            videoData.user_profile_picture = item.video.user.profile_picture.trim()
          }
          if (item.video.profile_picture && item.video.profile_picture.trim() !== "") {
            videoData.user_profile_picture = item.video.profile_picture.trim()
          }
          return videoData
        }
        // Otherwise, it's already in the old format (backward compatibility)
        return item
      })
      
      return {
        success: true,
        videos: videos,
        limit: responseLimit,
        offset: responseOffset,
        count: responseCount,
        username: responseUsername,
      }
    }
    
    return {
      success: false,
      videos: [],
      limit: limit,
      offset: offset,
      count: 0,
      username: username,
    }
  }

  // GET /videos/list/self - List videos uploaded by authenticated user
  // Note: API actually uses GET with query params, not POST
  // Response structure: { success: true, data: { videos: [{ video: {...}, following: boolean }], ... } }
  async listSelfVideos(data: { page?: number; limit?: number; offset?: number; seed?: string }): Promise<{
    success: boolean
    videos: Video[]
    page?: number
    limit: number
    offset: number
    count: number
    seed?: string
  }> {
    // Calculate offset from page if provided, otherwise use provided offset
    const limit = data.limit || 20
    const page = data.page || 1
    const offset = data.offset !== undefined ? data.offset : (page - 1) * limit
    
    // Build query parameters
    const params = new URLSearchParams()
    if (limit !== 20) params.append("limit", limit.toString())
    if (offset !== 0) params.append("offset", offset.toString())
    if (data.seed) params.append("seed", data.seed)
    
    const queryString = params.toString()
    const url = queryString ? `/videos/list/self?${queryString}` : "/videos/list/self"
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        videos?: VideoListItem[]
        page?: number
        limit?: number
        offset?: number
        count?: number
        seed?: string
      }
      videos?: VideoListItem[]
      page?: number
      limit?: number
      offset?: number
      count?: number
      seed?: string
    }>(
      url,
      {
        method: "GET",
      },
      true, // Authentication required per docs
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { videos: [{ video: {...}, following: boolean }], limit: 2, offset: 0, count: 1, seed: "jake" } }
    const isSuccess = !!(response.status === "success" || response.success)
    
    if (isSuccess) {
      // Extract fields from either response.data or directly from response
      const rawVideos = response.data?.videos || response.videos || []
      const responsePage = response.data?.page || response.page
      const responseLimit = response.data?.limit ?? response.limit ?? limit
      const responseOffset = response.data?.offset ?? response.offset ?? offset
      const responseCount = response.data?.count ?? response.count ?? 0
      const responseSeed = response.data?.seed || response.seed
      
      // Transform videos array to flatten structure and include following status
      // New API format: [{ video: {...}, following: boolean, profile_picture: string }]
      // Transform to: [{ ...video, following: boolean, user_profile_picture: string }]
      // Also preserve any user profile picture data
      const videos = rawVideos.map((item: any) => {
        // If item has 'video' property, it's the new format
        if (item.video) {
          const videoData: any = {
            ...item.video,
            following: item.following || false,
          }
          // Preserve user profile picture from the response
          // API returns profile_picture at the same level as video and following
          // Only set if profile_picture is a non-empty string
          if (item.profile_picture && item.profile_picture.trim() !== "") {
            videoData.user_profile_picture = item.profile_picture.trim()
          }
          // Also check other possible locations for backward compatibility
          if (item.user?.profile_picture && item.user.profile_picture.trim() !== "") {
            videoData.user_profile_picture = item.user.profile_picture.trim()
          }
          if (item.video.user?.profile_picture && item.video.user.profile_picture.trim() !== "") {
            videoData.user_profile_picture = item.video.user.profile_picture.trim()
          }
          if (item.video.profile_picture && item.video.profile_picture.trim() !== "") {
            videoData.user_profile_picture = item.video.profile_picture.trim()
          }
          return videoData
        }
        // Otherwise, it's already in the old format (backward compatibility)
        return item
      })
      
      return {
        success: true,
        videos: videos,
        page: responsePage || page,
        limit: responseLimit,
        offset: responseOffset,
        count: responseCount,
        seed: responseSeed,
      }
    }
    
    return {
      success: false,
      videos: [],
      limit: limit,
      offset: offset,
      count: 0,
    }
  }

  // Social endpoints - Video Social
  // POST /social/videos/upvote/{videoID} - Upvote a video
  async upvoteVideo(videoId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        message?: string
      }
      message?: string
    }>(
      `/social/videos/upvote/${videoId}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { message: "Video upvoted" } }
    const isSuccess = Boolean(response.status === "success" || response.success)
    const message = response.data?.message || response.message || ""
    
    return {
      success: isSuccess,
      message: message,
    }
  }

  // POST /social/videos/downvote/{videoID} - Downvote a video
  async downvoteVideo(videoId: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        message?: string
      }
      message?: string
    }>(
      `/social/videos/downvote/${videoId}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { message: "Video downvoted" } }
    const isSuccess = !!(response.status === "success" || response.success)
    const message = response.data?.message || response.message || ""
    
    return {
      success: isSuccess,
      message: message,
    }
  }

  // POST /social/videos/comment/{videoID} - Comment on a video
  async postComment(videoId: string, comment: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        message?: string
      }
      message?: string
    }>(
      `/social/videos/comment/${videoId}`,
      {
        method: "POST",
        body: JSON.stringify({ comment }),
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { message: "Video commented" } }
    const isSuccess = !!(response.status === "success" || response.success)
    const message = response.data?.message || response.message || ""
    
    return {
      success: isSuccess,
      message: message,
    }
  }

  // GET /social/videos/comments/{videoID} - List comments for a video
  async getComments(videoId: string, page: number = 1, limit: number = 20): Promise<{
    success: boolean
    comments: any[]
    limit: number
    offset: number
    count: number
  }> {
    const offset = (page - 1) * limit
    
    // Build query parameters
    const params = new URLSearchParams()
    if (limit !== 20) params.append("limit", limit.toString())
    if (offset !== 0) params.append("offset", offset.toString())
    
    const queryString = params.toString()
    const url = queryString ? `/social/videos/comments/${videoId}?${queryString}` : `/social/videos/comments/${videoId}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        comments?: any[]
        limit?: number
        offset?: number
        count?: number
      }
      comments?: any[]
      limit?: number
      offset?: number
      count?: number
    }>(
      url,
      {
        method: "GET",
      },
      false, // Authentication not required per docs (but recommended)
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { comments: [...], limit: 20, offset: 0, count: 150 } }
    const isSuccess = !!(response.status === "success" || response.success)
    
    if (isSuccess) {
      const comments = response.data?.comments || response.comments || []
      const responseLimit = response.data?.limit ?? response.limit ?? limit
      const responseOffset = response.data?.offset ?? response.offset ?? offset
      const responseCount = response.data?.count ?? response.count ?? 0
      
      return {
        success: true,
        comments: comments,
        limit: responseLimit,
        offset: responseOffset,
        count: responseCount,
      }
    }
    
    return {
      success: false,
      comments: [],
      limit: limit,
      offset: offset,
      count: 0,
    }
  }

  // POST /social/videos/reply/{commentID} - Reply to a comment
  async postReply(commentId: string, reply: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        message?: string
      }
      message?: string
    }>(
      `/social/videos/reply/${commentId}`,
      {
        method: "POST",
        body: JSON.stringify({ reply }),
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { message: "Reply added" } } or "Reply updated"
    const isSuccess = !!(response.status === "success" || response.success)
    const message = response.data?.message || response.message || ""
    
    return {
      success: isSuccess,
      message: message,
    }
  }

  // GET /social/videos/replies/{commentID} - List replies for a comment
  async getReplies(commentId: string, page: number = 1, limit: number = 20): Promise<{
    success: boolean
    replies: any[]
    limit: number
    offset: number
    count: number
  }> {
    const offset = (page - 1) * limit
    
    // Build query parameters
    const params = new URLSearchParams()
    if (limit !== 20) params.append("limit", limit.toString())
    if (offset !== 0) params.append("offset", offset.toString())
    
    const queryString = params.toString()
    const url = queryString ? `/social/videos/replies/${commentId}?${queryString}` : `/social/videos/replies/${commentId}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        replies?: any[]
        limit?: number
        offset?: number
        count?: number
      }
      replies?: any[]
      limit?: number
      offset?: number
      count?: number
    }>(
      url,
      {
        method: "GET",
      },
      false, // Authentication not required per docs (but recommended)
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { replies: [...], limit: 20, offset: 0, count: 25 } }
    const isSuccess = !!(response.status === "success" || response.success)
    
    if (isSuccess) {
      const replies = response.data?.replies || response.replies || []
      const responseLimit = response.data?.limit ?? response.limit ?? limit
      const responseOffset = response.data?.offset ?? response.offset ?? offset
      const responseCount = response.data?.count ?? response.count ?? 0
      
      return {
        success: true,
        replies: replies,
        limit: responseLimit,
        offset: responseOffset,
        count: responseCount,
      }
    }
    
    return {
      success: false,
      replies: [],
      limit: limit,
      offset: offset,
      count: 0,
    }
  }

  // Social endpoints - User Social
  // POST /social/users/follow/{username} - Follow a user
  async followUser(username: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        message?: string
      }
      message?: string
    }>(
      `/social/users/follow/${username}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { message: "Followed successfully" } }
    const isSuccess = Boolean(response.status === "success" || response.success)
    const message = response.data?.message || response.message || ""
    
    return {
      success: isSuccess,
      message: message,
    }
  }

  // POST /social/users/unfollow/{username} - Unfollow a user
  async unfollowUser(username: string): Promise<{ success: boolean; message: string }> {
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        message?: string
      }
      message?: string
    }>(
      `/social/users/unfollow/${username}`,
      {
        method: "POST",
        body: JSON.stringify({}),
      },
      true,
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { message: "Unfollowed successfully" } }
    const isSuccess = Boolean(response.status === "success" || response.success)
    const message = response.data?.message || response.message || ""
    
    return {
      success: isSuccess,
      message: message,
    }
  }

  // GET /social/users/following - List users that the current authenticated user is following
  // PRIVATE: Only returns the current user's following list
  async getFollowingList(limit: number = 20, offset: number = 0, seed?: string): Promise<{
    success: boolean
    following: Array<{
      followed_by: string
      followed_by_username?: string
      followed_to: string
      followed_to_username?: string
      followed_at: string
    }> | null
    limit: number
    offset: number
    count: number
    seed?: string
  }> {
    // Build query parameters
    const params = new URLSearchParams()
    if (limit !== 20) params.append("limit", limit.toString())
    if (offset !== 0) params.append("offset", offset.toString())
    if (seed) params.append("seed", seed)
    
    const queryString = params.toString()
    const url = queryString ? `/social/users/following?${queryString}` : "/social/users/following"
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        following?: Array<{
          followed_by: string
          followed_by_username?: string
          followed_to: string
          followed_to_username?: string
          followed_at: string
        }> | null
        limit?: number
        offset?: number
        count?: number
        seed?: string
      }
      following?: Array<{
        followed_by: string
        followed_by_username?: string
        followed_to: string
        followed_to_username?: string
        followed_at: string
      }> | null
      limit?: number
      offset?: number
      count?: number
      seed?: string
    }>(
      url,
      {
        method: "GET",
      },
      true, // Authentication required
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { following: [...], limit: 20, offset: 0, count: 0, seed: "..." } }
    const isSuccess = !!(response.status === "success" || response.success)
    
    if (isSuccess) {
      const following = response.data?.following ?? response.following ?? null
      const responseLimit = response.data?.limit ?? response.limit ?? limit
      const responseOffset = response.data?.offset ?? response.offset ?? offset
      const responseCount = response.data?.count ?? response.count ?? 0
      const responseSeed = response.data?.seed || response.seed
      
      return {
        success: true,
        following: following,
        limit: responseLimit,
        offset: responseOffset,
        count: responseCount,
        seed: responseSeed,
      }
    }
    
    return {
      success: false,
      following: null,
      limit: limit,
      offset: offset,
      count: 0,
    }
  }

  // GET /social/users/followers - List users who follow the current authenticated user
  // PRIVATE: Only returns the current user's followers list
  async getFollowersList(limit: number = 20, offset: number = 0, seed?: string): Promise<{
    success: boolean
    followers: Array<{
      followed_by: string
      followed_to: string
      followed_at: string
    }> | null
    limit: number
    offset: number
    count: number
    seed?: string
  }> {
    // Build query parameters
    const params = new URLSearchParams()
    if (limit !== 20) params.append("limit", limit.toString())
    if (offset !== 0) params.append("offset", offset.toString())
    if (seed) params.append("seed", seed)
    
    const queryString = params.toString()
    const url = queryString ? `/social/users/followers?${queryString}` : "/social/users/followers"
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        followers?: Array<{
          followed_by: string
          followed_to: string
          followed_at: string
        }> | null
        limit?: number
        offset?: number
        count?: number
        seed?: string
      }
      followers?: Array<{
        followed_by: string
        followed_to: string
        followed_at: string
      }> | null
      limit?: number
      offset?: number
      count?: number
      seed?: string
    }>(
      url,
      {
        method: "GET",
      },
      true, // Authentication required
    )
    
    // Normalize response structure
    // API returns: { success: true, data: { followers: [...], limit: 20, offset: 0, count: 0, seed: "..." } }
    const isSuccess = !!(response.status === "success" || response.success)
    
    if (isSuccess) {
      const followers = response.data?.followers ?? response.followers ?? null
      const responseLimit = response.data?.limit ?? response.limit ?? limit
      const responseOffset = response.data?.offset ?? response.offset ?? offset
      const responseCount = response.data?.count ?? response.count ?? 0
      const responseSeed = response.data?.seed || response.seed
      
      return {
        success: true,
        followers: followers,
        limit: responseLimit,
        offset: responseOffset,
        count: responseCount,
        seed: responseSeed,
      }
    }
    
    return {
      success: false,
      followers: null,
      limit: limit,
      offset: offset,
      count: 0,
    }
  }

  // Check if current user is following a specific user
  // Uses the private following list endpoint
  async checkFollowingStatus(targetUsername: string): Promise<boolean> {
    try {
      // Get current user's following list (private endpoint)
      const response = await this.getFollowingList(100, 0);
      if (!response.success || !response.following) {
        return false;
      }
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

  // Admin endpoints - List Users
  // GET /admin/users - List all users with optional filtering
  async adminListUsers(params: {
    limit?: number
    offset?: number
    username?: string
    name?: string
    role?: string
    uid?: string
    followers_min?: number
    followers_max?: number
    following_min?: number
    following_max?: number
    total_videos_min?: number
    total_videos_max?: number
    created_after?: string
    created_before?: string
    updated_after?: string
    updated_before?: string
  }): Promise<{
    status: string
    users: any[]
    limit: number
    offset: number
    count: number
    filters?: any
  }> {
    const queryParams = new URLSearchParams()
    
    // Pagination
    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString())
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString())
    
    // Text filters
    if (params.username) queryParams.append("username", params.username)
    if (params.name) queryParams.append("name", params.name)
    if (params.role) queryParams.append("role", params.role)
    if (params.uid) queryParams.append("uid", params.uid)
    
    // Numeric range filters
    if (params.followers_min !== undefined) queryParams.append("followers_min", params.followers_min.toString())
    if (params.followers_max !== undefined) queryParams.append("followers_max", params.followers_max.toString())
    if (params.following_min !== undefined) queryParams.append("following_min", params.following_min.toString())
    if (params.following_max !== undefined) queryParams.append("following_max", params.following_max.toString())
    if (params.total_videos_min !== undefined) queryParams.append("total_videos_min", params.total_videos_min.toString())
    if (params.total_videos_max !== undefined) queryParams.append("total_videos_max", params.total_videos_max.toString())
    
    // Date range filters
    if (params.created_after) queryParams.append("created_after", params.created_after)
    if (params.created_before) queryParams.append("created_before", params.created_before)
    if (params.updated_after) queryParams.append("updated_after", params.updated_after)
    if (params.updated_before) queryParams.append("updated_before", params.updated_before)
    
    const queryString = queryParams.toString()
    const endpoint = `/admin/users${queryString ? `?${queryString}` : ""}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        users?: any[]
        limit?: number
        offset?: number
        count?: number
        filters?: any
      }
      users?: any[]
      limit?: number
      offset?: number
      count?: number
      filters?: any
    }>(endpoint, { method: "GET" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        status: "success",
        users: response.data.users || [],
        limit: response.data.limit || params.limit || 20,
        offset: response.data.offset || params.offset || 0,
        count: response.data.count || 0,
        filters: response.data.filters || {},
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        status: response.status || "success",
        users: response.users || [],
        limit: response.limit || params.limit || 20,
        offset: response.offset || params.offset || 0,
        count: response.count || 0,
        filters: response.filters || {},
      }
    }
    
    return {
      status: "error",
      users: [],
      limit: params.limit || 20,
      offset: params.offset || 0,
      count: 0,
      filters: {},
    }
  }

  // Admin endpoints - List Videos
  // GET /admin/videos - List all videos with optional filtering
  async adminListVideos(params: {
    limit?: number
    offset?: number
    video_id?: string
    video_title?: string
    video_description?: string
    user_username?: string
    user_uid?: string
    video_tag?: string
    video_views_min?: number
    video_views_max?: number
    video_upvotes_min?: number
    video_upvotes_max?: number
    video_downvotes_min?: number
    video_downvotes_max?: number
    video_comments_min?: number
    video_comments_max?: number
    created_after?: string
    created_before?: string
    updated_after?: string
    updated_before?: string
  }): Promise<{
    status: string
    videos: any[]
    limit: number
    offset: number
    count: number
    filters?: any
  }> {
    const queryParams = new URLSearchParams()
    
    // Pagination
    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString())
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString())
    
    // Text filters
    if (params.video_id) queryParams.append("video_id", params.video_id)
    if (params.video_title) queryParams.append("video_title", params.video_title)
    if (params.video_description) queryParams.append("video_description", params.video_description)
    if (params.user_username) queryParams.append("user_username", params.user_username)
    if (params.user_uid) queryParams.append("user_uid", params.user_uid)
    if (params.video_tag) queryParams.append("video_tag", params.video_tag)
    
    // Numeric range filters
    if (params.video_views_min !== undefined) queryParams.append("video_views_min", params.video_views_min.toString())
    if (params.video_views_max !== undefined) queryParams.append("video_views_max", params.video_views_max.toString())
    if (params.video_upvotes_min !== undefined) queryParams.append("video_upvotes_min", params.video_upvotes_min.toString())
    if (params.video_upvotes_max !== undefined) queryParams.append("video_upvotes_max", params.video_upvotes_max.toString())
    if (params.video_downvotes_min !== undefined) queryParams.append("video_downvotes_min", params.video_downvotes_min.toString())
    if (params.video_downvotes_max !== undefined) queryParams.append("video_downvotes_max", params.video_downvotes_max.toString())
    if (params.video_comments_min !== undefined) queryParams.append("video_comments_min", params.video_comments_min.toString())
    if (params.video_comments_max !== undefined) queryParams.append("video_comments_max", params.video_comments_max.toString())
    
    // Date range filters
    if (params.created_after) queryParams.append("created_after", params.created_after)
    if (params.created_before) queryParams.append("created_before", params.created_before)
    if (params.updated_after) queryParams.append("updated_after", params.updated_after)
    if (params.updated_before) queryParams.append("updated_before", params.updated_before)
    
    const queryString = queryParams.toString()
    const endpoint = `/admin/videos${queryString ? `?${queryString}` : ""}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        videos?: any[]
        limit?: number
        offset?: number
        count?: number
        filters?: any
      }
      videos?: any[]
      limit?: number
      offset?: number
      count?: number
      filters?: any
    }>(endpoint, { method: "GET" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        status: "success",
        videos: response.data.videos || [],
        limit: response.data.limit || params.limit || 20,
        offset: response.data.offset || params.offset || 0,
        count: response.data.count || 0,
        filters: response.data.filters || {},
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        status: response.status || "success",
        videos: response.videos || [],
        limit: response.limit || params.limit || 20,
        offset: response.offset || params.offset || 0,
        count: response.count || 0,
        filters: response.filters || {},
      }
    }
    
    return {
      status: "error",
      videos: [],
      limit: params.limit || 20,
      offset: params.offset || 0,
      count: 0,
      filters: {},
    }
  }

  // Admin endpoints - List Comments
  // GET /admin/comments - List all comments with optional filtering
  async adminListComments(params: {
    limit?: number
    offset?: number
    filter?: string
  }): Promise<{
    status: string
    comments: any[]
    limit: number
    offset: number
    count: number
    filter?: string
  }> {
    const queryParams = new URLSearchParams()
    
    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString())
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString())
    if (params.filter) queryParams.append("filter", params.filter)
    
    const queryString = queryParams.toString()
    const endpoint = `/admin/comments${queryString ? `?${queryString}` : ""}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        comments?: any[]
        limit?: number
        offset?: number
        count?: number
        filter?: string
      }
      comments?: any[]
      limit?: number
      offset?: number
      count?: number
      filter?: string
    }>(endpoint, { method: "GET" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        status: "success",
        comments: response.data.comments || [],
        limit: response.data.limit || params.limit || 20,
        offset: response.data.offset || params.offset || 0,
        count: response.data.count || 0,
        filter: response.data.filter || params.filter,
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        status: response.status || "success",
        comments: response.comments || [],
        limit: response.limit || params.limit || 20,
        offset: response.offset || params.offset || 0,
        count: response.count || 0,
        filter: response.filter || params.filter,
      }
    }
    
    return {
      status: "error",
      comments: [],
      limit: params.limit || 20,
      offset: params.offset || 0,
      count: 0,
      filter: params.filter,
    }
  }

  // Admin endpoints - List Replies
  // GET /admin/replies - List all replies with optional filtering
  async adminListReplies(params: {
    limit?: number
    offset?: number
    filter?: string
  }): Promise<{
    status: string
    replies: any[]
    limit: number
    offset: number
    count: number
    filter?: string
  }> {
    const queryParams = new URLSearchParams()
    
    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString())
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString())
    if (params.filter) queryParams.append("filter", params.filter)
    
    const queryString = queryParams.toString()
    const endpoint = `/admin/replies${queryString ? `?${queryString}` : ""}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        replies?: any[]
        limit?: number
        offset?: number
        count?: number
        filter?: string
      }
      replies?: any[]
      limit?: number
      offset?: number
      count?: number
      filter?: string
    }>(endpoint, { method: "GET" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        status: "success",
        replies: response.data.replies || [],
        limit: response.data.limit || params.limit || 20,
        offset: response.data.offset || params.offset || 0,
        count: response.data.count || 0,
        filter: response.data.filter || params.filter,
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        status: response.status || "success",
        replies: response.replies || [],
        limit: response.limit || params.limit || 20,
        offset: response.offset || params.offset || 0,
        count: response.count || 0,
        filter: response.filter || params.filter,
      }
    }
    
    return {
      status: "error",
      replies: [],
      limit: params.limit || 20,
      offset: params.offset || 0,
      count: 0,
      filter: params.filter,
    }
  }

  // Admin endpoints - Get Counters
  // GET /admin/counters - Get platform statistics counters
  async adminCounters(noCache = false): Promise<{
    success: boolean
    counters: {
      users: number
      videos: number
      comments: number
      replies: number
      upvotes: number
      downvotes: number
      views: number
      watch_hours?: number
      updated_at: string
    }
  }> {
    let endpoint = "/admin/counters"
    // Add cache-busting query parameter if requested
    if (noCache) {
      endpoint += `?t=${Date.now()}`
    }
    
    const headers: Record<string, string> = {}
    if (noCache) {
      headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
      headers["Pragma"] = "no-cache"
      headers["Expires"] = "0"
    }
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        counters?: {
          users?: number
          videos?: number
          comments?: number
          replies?: number
          upvotes?: number
          downvotes?: number
          views?: number
          watch_hours?: number
          updated_at?: string
        }
      }
      counters?: {
        users?: number
        videos?: number
        comments?: number
        replies?: number
        upvotes?: number
        downvotes?: number
        views?: number
        watch_hours?: number
        updated_at?: string
      }
    }>(endpoint, { method: "GET", headers }, true)
    
    // Handle both response formats: {"success":true,"data":{counters:{...}}} and {"status":"success",counters:{...}}
    if (response.success && response.data?.counters) {
      return {
        success: true,
        counters: {
          users: response.data.counters.users || 0,
          videos: response.data.counters.videos || 0,
          comments: response.data.counters.comments || 0,
          replies: response.data.counters.replies || 0,
          upvotes: response.data.counters.upvotes || 0,
          downvotes: response.data.counters.downvotes || 0,
          views: response.data.counters.views || 0,
          watch_hours: response.data.counters.watch_hours,
          updated_at: response.data.counters.updated_at || new Date().toISOString(),
        },
      }
    }
    
    if (response.status === "success" || response.success) {
      const counters = response.counters || response.data?.counters || {}
      return {
        success: true,
        counters: {
          users: counters.users || 0,
          videos: counters.videos || 0,
          comments: counters.comments || 0,
          replies: counters.replies || 0,
          upvotes: counters.upvotes || 0,
          downvotes: counters.downvotes || 0,
          views: counters.views || 0,
          watch_hours: counters.watch_hours,
          updated_at: counters.updated_at || new Date().toISOString(),
        },
      }
    }
    
    return {
      success: false,
      counters: {
        users: 0,
        videos: 0,
        comments: 0,
        replies: 0,
        upvotes: 0,
        downvotes: 0,
        views: 0,
        updated_at: new Date().toISOString(),
      },
    }
  }

  // Admin endpoints - List Followers
  // GET /admin/followers - List all follower relationships with optional filtering
  async adminListFollowers(params: {
    limit?: number
    offset?: number
    followed_by_username?: string
    followed_to_username?: string
    followed_by?: string
    followed_to?: string
    followed_after?: string
    followed_before?: string
  }): Promise<{
    status: string
    followers: any[]
    limit: number
    offset: number
    count: number
    filters?: any
  }> {
    const queryParams = new URLSearchParams()
    
    // Pagination
    if (params.limit !== undefined) queryParams.append("limit", params.limit.toString())
    if (params.offset !== undefined) queryParams.append("offset", params.offset.toString())
    
    // Text filters
    if (params.followed_by_username) queryParams.append("followed_by_username", params.followed_by_username)
    if (params.followed_to_username) queryParams.append("followed_to_username", params.followed_to_username)
    if (params.followed_by) queryParams.append("followed_by", params.followed_by)
    if (params.followed_to) queryParams.append("followed_to", params.followed_to)
    
    // Date range filters
    if (params.followed_after) queryParams.append("followed_after", params.followed_after)
    if (params.followed_before) queryParams.append("followed_before", params.followed_before)
    
    const queryString = queryParams.toString()
    const endpoint = `/admin/followers${queryString ? `?${queryString}` : ""}`
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        followers?: any[]
        limit?: number
        offset?: number
        count?: number
        filters?: any
      }
      followers?: any[]
      limit?: number
      offset?: number
      count?: number
      filters?: any
    }>(endpoint, { method: "GET" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        status: "success",
        followers: response.data.followers || [],
        limit: response.data.limit || params.limit || 20,
        offset: response.data.offset || params.offset || 0,
        count: response.data.count || 0,
        filters: response.data.filters || {},
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        status: response.status || "success",
        followers: response.followers || [],
        limit: response.limit || params.limit || 20,
        offset: response.offset || params.offset || 0,
        count: response.count || 0,
        filters: response.filters || {},
      }
    }
    
    return {
      status: "error",
      followers: [],
      limit: params.limit || 20,
      offset: params.offset || 0,
      count: 0,
      filters: {},
    }
  }

  // Admin endpoints - Delete User
  // DELETE /admin/users/{uid} - Delete a user account by UID
  async deleteUserByUid(uid: string): Promise<{
    status: string
    message: string
  }> {
    if (!uid || uid.trim() === "") {
      throw new Error("User UID is required")
    }
    
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
      data?: {
        message?: string
      }
    }>(`/admin/users/${encodeURIComponent(uid)}`, { method: "DELETE" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        status: "success",
        message: response.data.message || response.message || "User deleted successfully",
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        status: response.status || "success",
        message: response.message || "User deleted successfully",
      }
    }
    
    return {
      status: "error",
      message: response.message || "Failed to delete user",
    }
  }

  // Admin endpoints - Disable User
  // POST /admin/users/{username}/disable - Disable a user account by username
  async adminDisableUser(username: string): Promise<{
    success: boolean
    data?: {
      message?: string
    }
    message?: string
  }> {
    if (!username || username.trim() === "") {
      throw new Error("Username is required")
    }
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        message?: string
      }
      message?: string
    }>(`/admin/users/${encodeURIComponent(username)}/disable`, { method: "POST" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          message: response.data.message || response.message || "User disabled successfully",
        },
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        success: true,
        message: response.message || "User disabled successfully",
      }
    }
    
    return {
      success: false,
      message: response.message || "Failed to disable user",
    }
  }

  // Admin endpoints - Enable User
  // POST /admin/users/{username}/enable - Enable a user account by username
  async adminEnableUser(username: string): Promise<{
    success: boolean
    data?: {
      message?: string
    }
    message?: string
  }> {
    if (!username || username.trim() === "") {
      throw new Error("Username is required")
    }
    
    const response = await this.request<{
      success?: boolean
      status?: string
      data?: {
        message?: string
      }
      message?: string
    }>(`/admin/users/${encodeURIComponent(username)}/enable`, { method: "POST" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        success: true,
        data: {
          message: response.data.message || response.message || "User enabled successfully",
        },
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        success: true,
        message: response.message || "User enabled successfully",
      }
    }
    
    return {
      success: false,
      message: response.message || "Failed to enable user",
    }
  }

  // Admin endpoints - Delete Video
  // DELETE /admin/videos/{videoID} - Delete a video by videoID
  async deleteVideoByVideoId(videoId: string): Promise<{
    status: string
    message: string
  }> {
    if (!videoId || videoId.trim() === "") {
      throw new Error("Video ID is required")
    }
    
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
      data?: {
        message?: string
      }
    }>(`/admin/videos/${encodeURIComponent(videoId)}`, { method: "DELETE" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        status: "success",
        message: response.data.message || response.message || "Video deleted successfully",
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        status: response.status || "success",
        message: response.message || "Video deleted successfully",
      }
    }
    
    return {
      status: "error",
      message: response.message || "Failed to delete video",
    }
  }

  // Admin endpoints - Delete Comment
  // DELETE /admin/comments/{commentID} - Delete a comment by commentID
  async deleteCommentByCommentId(commentId: string): Promise<{
    status: string
    message: string
  }> {
    if (!commentId || commentId.trim() === "") {
      throw new Error("Comment ID is required")
    }
    
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
      data?: {
        message?: string
      }
    }>(`/admin/comments/${encodeURIComponent(commentId)}`, { method: "DELETE" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        status: "success",
        message: response.data.message || response.message || "Comment deleted successfully",
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        status: response.status || "success",
        message: response.message || "Comment deleted successfully",
      }
    }
    
    return {
      status: "error",
      message: response.message || "Failed to delete comment",
    }
  }

  // Admin endpoints - Delete Reply
  // DELETE /admin/replies/{replyID} - Delete a reply by replyID
  async deleteReplyByReplyId(replyId: string): Promise<{
    status: string
    message: string
  }> {
    if (!replyId || replyId.trim() === "") {
      throw new Error("Reply ID is required")
    }
    
    const response = await this.request<{
      success?: boolean
      status?: string
      message?: string
      data?: {
        message?: string
      }
    }>(`/admin/replies/${encodeURIComponent(replyId)}`, { method: "DELETE" }, true)
    
    // Handle both response formats: {"success":true,"data":{...}} and {"status":"success",...}
    if (response.success && response.data) {
      return {
        status: "success",
        message: response.data.message || response.message || "Reply deleted successfully",
      }
    }
    
    if (response.status === "success" || response.success) {
      return {
        status: response.status || "success",
        message: response.message || "Reply deleted successfully",
      }
    }
    
    return {
      status: "error",
      message: response.message || "Failed to delete reply",
    }
  }

  // Legacy admin methods - kept for backward compatibility
  // These are deprecated and will be removed in a future version
  async getAllUsers(page: number = 1, limit: number = 100): Promise<{ users: any[]; total: number }> {
    console.warn("[API] getAllUsers is deprecated. Use adminListUsers instead.")
    const offset = (page - 1) * limit
    const response = await this.adminListUsers({ limit, offset })
    return {
      users: response.users || [],
      total: response.count || 0,
    }
  }

  async getAllVideos(page: number = 1, limit: number = 100): Promise<{ videos: any[]; total: number }> {
    console.warn("[API] getAllVideos is deprecated. Use adminListVideos instead.")
    const offset = (page - 1) * limit
    const response = await this.adminListVideos({ limit, offset })
    return {
      videos: response.videos || [],
      total: response.count || 0,
    }
  }

  async getAllComments(page: number = 1, limit: number = 100): Promise<{ comments: any[]; total: number }> {
    console.warn("[API] getAllComments is deprecated. Use adminListComments instead.")
    const offset = (page - 1) * limit
    const response = await this.adminListComments({ limit, offset })
    return {
      comments: response.comments || [],
      total: response.count || 0,
    }
  }

  async getAllReplies(page: number = 1, limit: number = 100): Promise<{ replies: any[]; total: number }> {
    console.warn("[API] getAllReplies is deprecated. Use adminListReplies instead.")
    const offset = (page - 1) * limit
    const response = await this.adminListReplies({ limit, offset })
    return {
      replies: response.replies || [],
      total: response.count || 0,
    }
  }

  async searchUsers(query: string, limit: number = 10): Promise<{ success: boolean; users: any[]; count: number }> {
    const response = await this.request<{
      success: boolean
      data?: {
        users: any[]
        count: number
        limit: number
        query: string
      }
    }>(`/search/users/${encodeURIComponent(query)}`, {}, false)
    
    if (response.success && response.data) {
      return {
        success: true,
        users: response.data.users || [],
        count: response.data.count || 0,
      }
    }
    
    return {
      success: false,
      users: [],
      count: 0,
    }
  }

  async searchVideos(query: string, limit: number = 10): Promise<{ success: boolean; videos: any[]; count: number }> {
    const response = await this.request<{
      success: boolean
      data?: {
        videos: any[]
        count: number
        limit: number
        query: string
      }
    }>(`/search/videos/${encodeURIComponent(query)}`, {}, false)
    
    if (response.success && response.data) {
      console.log("[API] searchVideos response:", {
        count: response.data.count,
        videos: response.data.videos?.length,
        firstVideo: response.data.videos?.[0] ? {
          video_id: response.data.videos[0].video_id,
          video_thumbnail: response.data.videos[0].video_thumbnail,
          video_title: response.data.videos[0].video_title,
        } : null
      })
      
      return {
        success: true,
        videos: response.data.videos || [],
        count: response.data.count || 0,
      }
    }
    
    return {
      success: false,
      videos: [],
      count: 0,
    }
  }
}

export const apiClient = new ApiClient()
