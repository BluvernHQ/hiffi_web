# HLS Implementation Flow: From API Metadata to Video Playback

This document explains how the Hiffi platform retrieves video metadata from the backend API and transitions to HLS-based video playback.

---

## Overview

The HLS playback implementation follows a multi-step flow:
1. **Backend API Call** → Get video metadata and storage path
2. **Path Resolution** → Convert storage path to HLS manifest URL
3. **VideoJS Initialization** → Load HLS manifest with authentication
4. **Segment Fetching** → Stream video segments with adaptive bitrate

---

## Step 1: Getting Metadata from `/videos/{videoID}`

### API Endpoint
```
GET /videos/{videoID}
```

### Authentication
- **Optional** (but recommended)
- If authenticated, returns additional user-specific data:
  - `upvoted`: Whether user has upvoted this video
  - `downvoted`: Whether user has downvoted this video
  - `following`: Whether user follows the video creator
  - `profile_picture`: Latest profile picture of the creator

### API Response Structure

```json
{
  "success": true,
  "data": {
    "video": {
      "video_id": "abc123def456...",
      "video_url": "videos/abc123def456...",
      "video_thumbnail": "thumbnails/videos/abc123def456....jpg",
      "video_title": "Amazing Video",
      "video_description": "This is an amazing video",
      "video_tags": ["gaming", "funny"],
      "video_views": 150,
      "video_upvotes": 42,
      "video_downvotes": 2,
      "video_comments": 10,
      "user_uid": "user123...",
      "user_username": "johndoe",
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:22:00Z"
    },
    "video_url": "https://black-paper-83cf.hiffi.workers.dev/videos/abc123...",
    "upvoted": false,
    "downvoted": false,
    "following": false,
    "profile_picture": "thumbnails/users/johndoe.jpg"
  }
}
```

### Key Fields Explained

1. **`video_url`** (in response.data):
   - **Type**: Full Workers URL string
   - **Format**: `https://black-paper-83cf.hiffi.workers.dev/videos/{videoID}`
   - **Purpose**: This is the base URL for accessing video assets
   - **Note**: This is NOT the HLS manifest URL yet - it's the base path

2. **`video.video_url`** (in video object):
   - **Type**: Storage path string
   - **Format**: `videos/abc123def456...`
   - **Purpose**: Internal storage path (used for path resolution)

3. **`video`** object:
   - Contains all video metadata (title, description, views, etc.)
   - Used to populate the video player UI

### Implementation Location

**File**: `app/watch/[videoId]/page.tsx`

```typescript
// Line 132: Call the API
videoResponse = await apiClient.getVideo(videoId)

// Line 147-153: Extract data
const completeVideo = {
  ...videoData,
  video_url: videoResponse.video_url, // Streaming URL from API
  streaming_url: videoResponse.video_url, // Alias for compatibility
  userUsername: videoData.user_username,
  user_profile_picture: videoResponse.profile_picture,
}
```

**File**: `lib/api-client.ts`

```typescript
// Line 1152-1227: getVideo method implementation
async getVideo(videoId: string): Promise<{
  success: boolean
  video_url: string  // This is the Workers URL
  video?: any        // Full video object
  upvoted?: boolean
  downvoted?: boolean
  following?: boolean
  profile_picture?: string
}>
```

---

## Step 2: Transitioning to HLS

### Flow Diagram

```
API Response (video_url)
    ↓
VideoPlayer Component receives videoUrl prop
    ↓
Check if videoUrl is ID or path
    ↓
If ID → Call getVideo() again to get path
    ↓
resolveVideoSource(targetPath)
    ↓
getVideoUrl() → Construct Workers base URL
    ↓
Append "/hls/master.m3u8"
    ↓
HLS Manifest URL ready
    ↓
VideoJS loads manifest
    ↓
XHR hooks inject x-api-key header
    ↓
Player fetches segments
```

### Implementation Details

#### 2.1 Path Resolution

**File**: `components/video/video-player.tsx` (Lines 281-328)

```typescript
useEffect(() => {
  const fetchUrl = async () => {
    let targetPath = videoUrl
    
    // If it's a video ID (64-char hex), get the path from API
    if (/^[a-f0-9]{64}$/i.test(videoUrl)) {
      const response = await apiClient.getVideo(videoUrl)
      if (response.success && response.video_url) {
        targetPath = response.video_url
      }
    }

    // Resolve to HLS source
    const source = await resolveVideoSource(targetPath)
    setSignedVideoUrl(source.url)  // This is the HLS manifest URL
  }
  
  fetchUrl()
}, [videoUrl])
```

#### 2.2 Video Source Resolution

**File**: `lib/video-resolver.ts`

```typescript
export async function resolveVideoSource(videoPath: string): Promise<VideoSource> {
  // 1. Check cache first
  if (resolutionCache.has(videoPath)) {
    return resolutionCache.get(videoPath)!
  }

  // 2. Clean the path (remove any existing HLS/manifest suffixes)
  let cleanPath = videoPath
  if (videoPath.endsWith('/hls/master.m3u8')) {
    cleanPath = videoPath.replace(/\/hls\/master\.m3u8$/, "")
  } else if (videoPath.endsWith('/original/source.mp4')) {
    cleanPath = videoPath.replace(/\/original\/source\.mp4$/, "")
  }

  // 3. Construct Workers URL
  const processedUrl = getVideoUrl(cleanPath).replace(/\/$/, "")
  
  // 4. Append HLS manifest path
  const hlsUrl = `${processedUrl}/hls/master.m3u8`
  
  // 5. Cache and return
  const resolvedSource: VideoSource = { type: 'hls', url: hlsUrl }
  resolutionCache.set(videoPath, resolvedSource)
  return resolvedSource
}
```

**File**: `lib/storage.ts`

```typescript
export function getVideoUrl(videoPath: string): string {
  // If already a full Workers URL, return as is
  if (videoPath.startsWith(`${WORKERS_BASE_URL}/`)) {
    return videoPath
  }
  
  // If another full URL, return as is
  if (videoPath.startsWith("http://") || videoPath.startsWith("https://")) {
    return videoPath
  }
  
  // Construct Workers URL
  // Format: https://black-paper-83cf.hiffi.workers.dev/{videoPath}
  return `${WORKERS_BASE_URL}/${videoPath}`
}
```

### Example Transformation

**Input** (from API):
```
video_url: "https://black-paper-83cf.hiffi.workers.dev/videos/abc123def456..."
```

**After `resolveVideoSource()`**:
```
HLS URL: "https://black-paper-83cf.hiffi.workers.dev/videos/abc123def456.../hls/master.m3u8"
```

---

## Step 3: HLS Playback Initialization

### VideoJS Setup

**File**: `components/video/video-player.tsx` (Lines 427-534)

```typescript
useEffect(() => {
  if (!isReady || !videoRef.current || !signedVideoUrl || !videoSourceType) return

  const vjs = window.videojs

  // Initialize VideoJS player
  if (!playerRef.current && videoRef.current) {
    playerRef.current = vjs(videoRef.current, {
      autoplay: autoPlay ? 'any' : false,
      muted: isMuted,
      controls: false, // Custom UI
      responsive: true,
      fluid: false,
      poster: signedPosterUrl || poster,
      preload: 'auto',
      html5: {
        vhs: {
          enableLowInitialPlaylist: true,  // Start with lowest bitrate
          fastQualityTeardown: true,        // Switch quality faster
          overrideNative: true,            // Use VideoJS HLS engine
          useDevicePixelRatio: true,
        }
      }
    })
  }

  // Set HLS source
  player.ready(() => {
    player.muted(isMuted)
    player.volume(volume)
    
    player.src({
      src: signedVideoUrl,  // HLS manifest URL
      type: "application/x-mpegURL"
    })
  })
}, [isReady, signedVideoUrl, videoSourceType, autoPlay])
```

### Authentication via XHR Hooks

**File**: `components/video/video-player.tsx`

```typescript
// Configure global VHS settings before player creation
if (vjs.Vhs) {
  vjs.Vhs.xhr.beforeRequest = (options: any) => {
    // Inject API key for authentication
    const apiKey = getWorkersApiKey()
    if (apiKey) {
      options.headers = options.headers || {}
      options.headers["x-api-key"] = apiKey
    }

    // Standardized path rewriting for segments
    if (options.uri) {
      const hlsSegmentPattern = /(\/videos\/[^\/]+\/hls\/[^\/]+\/)(seg_\d+\.ts|seg_\d+\.m4s)$/
      if (hlsSegmentPattern.test(options.uri)) {
        options.uri = options.uri.replace(hlsSegmentPattern, "$1segments/$2")
      }
    }
    return options
  }
}
```

### What the XHR Hooks Do

1. **Inject Authentication**: Every request to Workers (manifest, segments, profiles.json) gets `x-api-key` header
2. **Fix Segment Paths**: Rewrites segment URLs to include `/segments/` subdirectory
   - Example: `.../hls/seg_001.ts` → `.../hls/segments/seg_001.ts`
3. **Global Scope**: By using `vjs.Vhs.xhr.beforeRequest`, we ensure all HLS requests across the entire application follow the same rules consistently.

---

## Step 4: HLS Manifest and Segment Fetching

### HLS Manifest Structure

The player requests:
```
GET https://black-paper-83cf.hiffi.workers.dev/videos/abc123.../hls/master.m3u8
Headers: x-api-key: SECRET_KEY
```

**Response** (master.m3u8):
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1920x1080
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=854x480
480p.m3u8
```

### Quality Profiles

**File**: `components/video/video-player.tsx` (Lines 330-356)

```typescript
useEffect(() => {
  if (!signedVideoUrl || videoSourceType !== 'hls') return

  const fetchProfiles = async () => {
    // Convert master.m3u8 URL to profiles.json URL
    const profilesUrl = signedVideoUrl.replace(/master\.m3u8$/, "profiles.json")
    
    const apiKey = getWorkersApiKey()
    const headers: Record<string, string> = apiKey ? { "x-api-key": apiKey } : {}
    
    const response = await fetch(profilesUrl, { headers })
    if (response.ok) {
      const data = await response.json()
      setProfiles(data)  // Used for quality selection UI
    }
  }

  fetchProfiles()
}, [signedVideoUrl])
```

**profiles.json** structure:
```json
{
  "1080p": {
    "height": 1080,
    "bitrate": 2500000,
    "path": "1080p.m3u8"
  },
  "720p": {
    "height": 720,
    "bitrate": 1500000,
    "path": "720p.m3u8"
  },
  "480p": {
    "height": 480,
    "bitrate": 800000,
    "path": "480p.m3u8"
  }
}
```

### Segment Fetching

Once the player selects a quality (auto or manual), it requests:
```
GET https://black-paper-83cf.hiffi.workers.dev/videos/abc123.../hls/1080p.m3u8
Headers: x-api-key: SECRET_KEY
```

**Response** (1080p.m3u8):
```
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXTINF:10.0,
segments/seg_001.ts
#EXTINF:10.0,
segments/seg_002.ts
#EXTINF:10.0,
segments/seg_003.ts
...
```

The player then fetches segments:
```
GET https://black-paper-83cf.hiffi.workers.dev/videos/abc123.../hls/segments/seg_001.ts
Headers: x-api-key: SECRET_KEY
```

---

## Summary: Complete Flow

1. **User navigates** to `/watch/[videoId]`
2. **Page calls** `apiClient.getVideo(videoId)` → `GET /videos/{videoID}`
3. **API returns**:
   - `video_url`: Workers base URL
   - `video`: Full metadata object
   - User-specific flags (upvoted, following, etc.)
4. **Page passes** `video_url` to `VideoPlayer` component
5. **VideoPlayer** checks if input is ID or path
6. **If ID**, calls `getVideo()` again to get path
7. **Resolves** path to HLS URL via `resolveVideoSource()`:
   - Uses `getVideoUrl()` to construct Workers URL
   - Appends `/hls/master.m3u8`
8. **VideoJS initializes** with HLS source
9. **XHR hooks** inject `x-api-key` header into all requests
10. **Player fetches**:
    - `master.m3u8` (manifest)
    - `profiles.json` (quality info)
    - Quality-specific playlist (e.g., `1080p.m3u8`)
    - Video segments (`seg_001.ts`, `seg_002.ts`, ...)
11. **Adaptive bitrate** automatically switches quality based on network
12. **User can manually** select quality from dropdown menu

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `app/watch/[videoId]/page.tsx` | Calls API, passes data to VideoPlayer |
| `lib/api-client.ts` | `getVideo()` method - API client |
| `components/video/video-player.tsx` | Main player component, HLS initialization |
| `lib/video-resolver.ts` | Converts storage path to HLS URL |
| `lib/storage.ts` | Constructs Workers URLs, API key management |

---

## Authentication Flow

All HLS-related requests require the `x-api-key` header:

```typescript
// From lib/storage.ts
export function getWorkersApiKey(): string {
  return process.env.NEXT_PUBLIC_WORKERS_API_KEY || "SECRET_KEY"
}
```

The XHR hooks automatically inject this header into:
- HLS manifest requests (`master.m3u8`)
- Quality playlist requests (`1080p.m3u8`, etc.)
- Video segment requests (`seg_001.ts`, etc.)
- Profile metadata requests (`profiles.json`)

---

## Notes

1. **Path vs URL**: The API returns a full Workers URL, but the internal `video.video_url` field contains just the storage path. The resolver handles both formats.

2. **Caching**: `resolveVideoSource()` uses in-memory caching to avoid redundant processing during the same session.

3. **Segment Path Rewriting**: The XHR hook automatically fixes segment URLs to include the `/segments/` subdirectory, ensuring compatibility with the storage structure.

4. **Adaptive Bitrate**: VideoJS's VHS plugin automatically switches quality based on network conditions, starting with the lowest bitrate for instant playback.

5. **Quality Selection**: Users can manually override auto quality by selecting from the dropdown menu, which switches the player's source to a specific quality playlist.

